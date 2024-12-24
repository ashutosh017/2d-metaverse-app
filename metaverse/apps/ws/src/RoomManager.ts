import { outGoingMessage, spaceId } from "./types";
import { User } from "./User";

export class RoomManager {
  rooms: Map<spaceId, User[]> = new Map();
  static instance: RoomManager;

  private constructor() {
    this.rooms = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RoomManager();
    }
    return this.instance;
  }
  public removeUser(user: User, spaceId: string) {
    if (!this.rooms.has(spaceId)) {
      return;
    }
    this.rooms.set(
      spaceId,
      this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []
    );
  }

  public addUser(user: User, spaceId: string) {
    if (!this.rooms.has(spaceId)) {
      this.rooms.set(spaceId, [user]);
      return;
    }
    this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
  }
  public broadcast(message: outGoingMessage, user: User, spaceId: string) {
    if (!this.rooms.has(spaceId)) {
      return;
    }
    this.rooms.get(spaceId)?.forEach((u: User) => {
      if (user.id !== u.id) {
        u.send(message);
      }
    });
  }
}
