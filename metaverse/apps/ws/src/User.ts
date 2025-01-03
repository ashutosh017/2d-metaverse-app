import jwt, { JwtPayload } from "jsonwebtoken";
import client from "@repo/db/client";
const jwt_secret = "jwt_secret";
import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { outGoingMessage } from "./types";

function getRandomId(length:number){
    const a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    let res = "";
    for(let i = 0; i<length; i++){
        res+=a[Math.floor(Math.random()*a.length)]
    }
    
    return res;
}

export class User {
  private ws: WebSocket;
  public id: string | null;
  private spaceId: string | null;
  public x: number ;
  public y: number ;
  constructor(ws: WebSocket) {
    this.ws = ws;
    this.id = getRandomId(10);
    this.spaceId = null;
    this.x = 0;
    this.y = 0;
  }
  send(message: outGoingMessage) {
    this.ws.send(JSON.stringify(message));
  }
  destroy() {
    RoomManager.getInstance().broadcast(
      {
        type: "user-left",
        payload: {
          userId: this.id,
        },
      },
      this,
      // TODO: ensure spaceId always present
      this.spaceId!
    );
    this.ws.close();
    return;
  }
  initHandler() {
    this.ws.onmessage = async (data) => {
      const parsedData = JSON.parse(data.toString());
      switch (parsedData.type) {
        case "join":
          const spaceId = parsedData.payload.spaceId;
          const token = parsedData.payload.token;
          const userId = (jwt.verify(token, jwt_secret) as JwtPayload).userId;
          if (!userId) {
            this.ws.close();
            return;
          }
          this.id = userId;
          const space = await client.space.findFirst({
            where: {
              id: spaceId,
            },
          });
          if (!space) {
            this.ws.close();
            return;
          }
          this.spaceId = space.id;
          this.x = Math.floor(Math.random() * space.width);
          this.y = Math.floor(Math.random() * space.height);
          // sending to the user that he/she has joined the space and these are the users present in that space already
          this.send({
            type: "space-joined",
            payload: {
              spawn: {
                x: this.x,
                y: this.y,
              },
              users: RoomManager.getInstance()
                .rooms.get(this.spaceId!)
                ?.map((u) => {
                  if (u.id !== this.id) {
                    return u.id;
                  }
                }),
            },
          });
          // sending to the other users of the space that someone has joined with this userId at this perticular location
          RoomManager.getInstance().broadcast(
            {
              type: "user-joined",
              payload: {
                userId: this.id,
                x: this.x,
                y: this.y,
              },
            },
            this,
            this.spaceId!
          );
          break;
          case "move": 
            const moveX = parsedData.payload.x
            const moveY = parsedData.payload.y
            const xDisplacement = Math.abs(moveX - this.x)
            const yDisplacement = Math.abs(moveY - this.y)
            if((xDisplacement===1 && yDisplacement===0) || (xDisplacement===0 && yDisplacement===1)){
                RoomManager.getInstance().broadcast({
                    type:"movement",
                    payload:{
                        x:this.x,
                        y:this.y
                    }
                },this, this.spaceId!)
            }
            this.send({
                type:"movement-rejected",
                payload:{
                    x:this.x,
                    y:this.y
                }
            })
      }
    };
  }
}
