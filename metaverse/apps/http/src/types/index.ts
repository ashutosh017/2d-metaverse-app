import z from 'zod'

export const signupSchema = z.object({
    username:z.string().min(4).max(100),
    password:z.string().min(4).max(1000),
    type:z.enum(["user","admin"])

})

export const signinSchema = z.object({
    username:z.string().min(4).max(100),
    password:z.string().min(4).max(1000),
})

export const UpdateMetadataSchema = z.object({
    avatarId:z.string()
})

export const createSpaceSchema = z.object({
  name:z.string(),
  dimensions:z.string(),
  mapId:z.string().optional()
})

export const addElementSchema = z.object({
  elementId:z.string(),
  spaceId:z.string(),
  x:z.number(),
  y:z.number()
})

export const createElementSchema = z.object({
  imageUrl:z.string(),
  width:z.number(),
  height:z.number(),
  static:z.boolean()
})

export const createAvatarSchema = z.object({
  imageUrl:z.string(),
  name:z.string()
})

export const createMapSchema = z.object({
  thumbnail:z.string(),
  dimensions:z.string().regex(/^[0-9]{1-4}x[0-9]{1-4}$/),
  name:z.string(),
  defaultElements:z.array(z.object({
    elementId:z.string(),
    x:z.number(),
    y:z.number()
  }))

})

declare global {
    namespace Express {
      export interface Request {
        role?: "Admin" | "User";
        userId?: string;
      }
    }
}