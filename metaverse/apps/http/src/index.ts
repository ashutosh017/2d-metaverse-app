import express from "express";
import {
  addElementSchema,
  createAvatarSchema,
  createElementSchema,
  createMapSchema,
  createSpaceSchema,
  signinSchema,
  signupSchema,
  UpdateMetadataSchema,
} from "./types";
import bcrypt from "bcrypt";
import client from "@repo/db/client";
import jwt from "jsonwebtoken";
import { jwt_secret } from "./config";

const app = express();

// (done) 1 signup
app.post("api/v1/signup", async (req, res) => {
  const { username, password, type } = req.body;
  const parsedSchema = signupSchema.safeParse(req.body);
  if (!parsedSchema.success) {
    res.status(400).json({
      msg: "validation faild",
    });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await client.user.create({
      data: {
        username: parsedSchema.data.username,
        password: hashedPassword,
        role: parsedSchema.data.type === "admin" ? "Admin" : "User",
      },
    });

    res.status(200).json({
      userId: user.id,
    });
  } catch (error) {
    res.status(400).json({
      msg: "User alrady exists",
    });
  }
});

// (done) 2 signin
app.post("api/v1/signin", async (req, res) => {
  const parsedSchema = signinSchema.safeParse(req.body);
  if (!parsedSchema.success) {
    res.status(403).json({
      msg: "validation failed",
    });
    return;
  }
  try {
    const user = await client.user.findFirst({
      where: {
        username: parsedSchema.data.username,
      },
    });

    if (!user) {
      res.status(403).json({
        msg: "user does not exists",
      });
      return;
    }

    const isValid = await bcrypt.compare(
      parsedSchema.data.password,
      user.password
    );

    if (!isValid) {
      res.status(403).json({
        msg: "Invalid username or password",
      });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, jwt_secret);
    console.log("jwt secret: ", jwt_secret);

    res.status(200).json({
      token,
    });
  } catch (error) {
    res.status(403).json({
      msg: "Internal server error",
    });
  }
});

// ************** User information page *******

// (done) 3 Update metadata
app.post("/api/v1/user/metadata", async (req, res) => {
  const parsedData = UpdateMetadataSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(403).json({
      msg: "validation failed",
    });
    return;
  }
  try {
    await client.user.update({
      where: {
        id: req.userId,
      },
      data: {
        avatarId: parsedData.data.avatarId,
      },
    });
    res.status(200).json({
      msg: "avatar changed",
    });
  } catch (error) {
    res.status(400).json({ msg: "internal server error" });
  }
});

// (done) 4 Get available avatars
app.get("api/v1/avatars", async (req, res) => {
  const avatars = await client.avatar.findMany();
  res.status(200).json({
    avatars,
  });
});

// (pending...) 5 Get other users metadata (name and avatarUrl)
app.get("/api/v1/user/metadata/bulk?id", (req, res) => {});

// ************** Space dashboard ****************

// (done) 6 create a space
app.post("api/v1/space", async (req, res) => {
  const parsedData = createSpaceSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      msg: "Invalid schema",
    });
    return;
  }
  if (!parsedData.data.mapId) {
    const space = await client.space.create({
      data: {
        height: parseInt(parsedData.data.dimensions?.split("x")[0]),
        width: parseInt(parsedData.data.dimensions?.split("x")[1]),
        name: parsedData.data.name,
        creatorId: req.userId!,
      },
    });
    res.status(200).json({
      spaceId: space.id,
    });
    return;
  }
  const map = await client.map.findFirst({
    where: {
      id: parsedData.data.mapId,
    },
    select: {
      mapElements: true,
      widhth: true,
      height: true,
    },
  });
  if (!map) {
    res.status(400).json({
      msg: "map not found",
    });
    return;
  }

  const space = await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        // TODO: assure here that userId always present
        creatorId: req.userId!,
        height: parseInt(parsedData.data.dimensions.split("x")[0]),
        width: parseInt(parsedData.data.dimensions.split("x")[1]),
        name: parsedData.data.name,
      },
    });
    await client.spaceElement.createMany({
      data: map.mapElements.map((e:any) => ({
        spaceId: space.id,
        elementId: e.elementId,
        // TODO: assure co-ordinates
        x: e.x!,
        y: e.y!,
      })),
    });
    return space;
  });
  res.status(200).json({
    spaceId: space.id,
  });
  return;
});

// (done) 7 Delete a space
app.delete("api/v1/space/:spaceid", async (req, res) => {
  const spaceId = req.params.spaceid;
  try {
    const space = await client.space.findUnique({
      where: {
        id: spaceId,
      },
      select: {
        creatorId: true,
      },
    });

    if (!space) {
      res.status(400).json({
        msg: "space not found",
      });
      return;
    }
    if (space.creatorId !== req.userId) {
      res.status(403).json({
        msg: "unauthorized",
      });
      return;
    }
    await client.space.delete({
      where: {
        id: spaceId,
      },
    });
    res.status(200).json({
      msg: "space deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      msg: "error deleting space",
    });
  }
});

// (done) 8 Get my existing space
app.get("api/v1/space/all", async (req, res) => {
  const spaces = await client.space.findMany();
  res.status(200).json({
    spaces,
  });
});

// *************** Arena ************************

// (done) 9 get a space
app.get("api/v1/space/:spaceid", async (req, res) => {
  const spaceId = req.params.spaceid;
  const space = await client.space.findUnique({
    where: {
      id: spaceId,
    },
    include: {
      elements: {
        include: {
          element: true,
        },
      },
    },
  });
  if (!space) {
    res.status(400).json({
      msg: "space not found",
    });
    return;
  }
  res.status(200).json({
    dimensions: `${space.height}x${space.width}`,
    elements: space.elements.map((element:any) => ({
      id: element.id,
      element: {
        id: element.element.id,
        imageUrl: element.element.imageUrl,
        static: element.element.static,
        height: element.element.height,
        width: element.element.width,
      },
      x: element.x,
      y: element.y,
    })),
  });
});

// (done) 10 add an element
app.post("api/v1/space/element", async (req, res) => {
  const parsedBody = addElementSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      msg: {
        error: parsedBody.error,
      },
    });
    return;
  }
  const { elementId, spaceId, x, y } = req.body;

  const space = await client.space.findUnique({
    where: {
      id: spaceId,
    },
  });

  if (!space) {
    res.status(400).json({
      msg: "space not found",
    });
    return;
  }
  if (x < 0 || y < 0 || x > space.width || y > space.height) {
    res.status(400).json({
      msg: "element is out of the boundry",
    });
    return;
  }

  await client.spaceElement.create({
    data: {
      x,
      y,
      spaceId,
      elementId,
    },
  });
  res.status(200).json({
    msg: "element added",
  });
});

// (done) 11 delete an element
app.delete("api/v1/space/element", async (req, res) => {
  const id = req.body;
  if (!id) {
    res.status(400).json({
      msg: "id is not there",
    });
    return;
  }
  const element = await client.spaceElement.findUnique({
    where: {
      id,
    },
    include: {
      space: true,
    },
  });

  if (element?.space.creatorId !== req.userId) {
    res.status(403).json({
      msg: "unauthorized",
    });
    return;
  }
  if (!element) {
    res.status(400).json({
      msg: "element not found",
    });
    return;
  }
  await client.spaceElement.delete({
    where: {
      id,
    },
  });

  res.json({
    msg: "element deleted",
  });
});

// (done) 12 See all available elements
app.get("api/v1/elements", async (req, res) => {
  const elements = await client.element.findMany();
  res.status(200).json({
    elements: elements.map((element:any) => ({
      id: element.id,
      imageUrl: element.imageUrl,
      width: element.width,
      height: element.height,
      static: element.static,
    })),
  });
});

// ************** Admin/Map Creator endpoints ****************

// (done)  13 create an element
app.post("api/v1/admin/element", async (req, res) => {
  const parsedSchema = createElementSchema.safeParse(req.body);

  if (!parsedSchema.success) {
    res.status(400).json({
      msg: "validation failed",
    });
    return;
  }

  const element = await client.element.create({
    data: {
      height: parsedSchema.data.height,
      width: parsedSchema.data.width,
      imageUrl: parsedSchema.data.imageUrl,
      static: parsedSchema.data.static,
    },
  });

  res.status(200).json({
    msg: "element created",
    id: element.id,
  });
});

// (done) 14 Update an element
app.put("api/v1/admin/element/:elementid", async (req, res) => {
  const id = req.params.elementid;
  const imageUrl = req.body;
  if (!id || !imageUrl) {
    return;
  }
  await client.element.update({
    where: {
      id,
    },
    data: {
      imageUrl,
    },
  });
  res.status(200).json({ msg: "element updated" });
});

// (done) 15 create an avatar
app.post("api/v1/admin/avatar", async (req, res) => {
  const parsedSchema = createAvatarSchema.safeParse(req.body);
  if (!parsedSchema.success) {
    res.status(400).json({ msg: "validation failed" });
    return;
  }
  const avatar = await client.avatar.create({
    data: {
      imageUrl: parsedSchema.data.imageUrl,
      name: parsedSchema.data.name,
    },
  });
  res.status(200).json({
    avatarId: avatar.id,
  });
});

// (done) 16 create a map
app.post("api/v1/admin/map", async (req, res) => {
  const parsedSchema = createMapSchema.safeParse(req.body);
  if (!parsedSchema.success) {
    res.status(400).json({ msg: "validation failed" });
    return;
  }
  const map = await client.map.create({
    data: {
      name: parsedSchema.data.name,
      height: parseInt(parsedSchema.data.dimensions.split("x")[0]),
      widhth: parseInt(parsedSchema.data.dimensions.split("x")[1]),
      thumbnail: parsedSchema.data.thumbnail,
      mapElements: {
        create: parsedSchema.data.defaultElements.map((elem) => ({
          elementId: elem.elementId,
          x: elem.x,
          y: elem.y,
        }))
      }
    }
  });

  res.status(200).json({
    mapId:map.id
  })
});

app.listen(3000, () => {
  console.log("app is listening on port 3000");
});
