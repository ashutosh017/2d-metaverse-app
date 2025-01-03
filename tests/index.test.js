const axios2 = require("axios");

const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:8080";

const axios = {
  post: async (...args) => {
    try {
      const res = await axios2.post(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
  put: async (...args) => {
    try {
      const res = await axios2.put(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
  get: async (...args) => {
    try {
      const res = await axios2.get(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
  delete: async (...args) => {
    try {
      const res = await axios2.delete(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
};

describe("Authentication", () => {
  test("User is able to sign up only once", async () => {
    const username = "ashutosh" + Math.random(); //ashutosh0.12342
    const password = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username:username,
      password:password,
      type: "admin",
    });
    expect(response.status).toBe(200);
    const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    expect(response.status).toBe(400);
  });
  test("signup request fails when username is empty", async () => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      password,
      type: "admin",
    });
    expect(response.status).toBe(400);
  });
  test("Signin succeeds if the username and password is correct", async () => {
    const username = "ashutosh" + Math.random();
    const password = "123456";
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
      type: "admin",
    });
    expect(response.status).toBe(200);
  });
  test("Signin fails if the username and password are incorrect", async () => {
    const username = "ashutosh" + Math.random();
    const password = "123456";

    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: "WrongUsername",
      password,
    });

    expect(response.status).toBe(403);
  });
});

describe("user metadata endpoint", () => {
  let token = "";
  let avtarId = "";
  beforeAll(async () => {
    const username = "ashutosh" + Math.random();
    const password = "123456";
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
      type: "admin",
    });
    token = response.data.token;

    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("avatarresponse is " + avatarResponse.data.avatarId);

    avatarId = avatarResponse.data.avatarId;
  });
  test("User cant update their metadata with a wrong avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId: "123123123",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  test("User can update their metadata with the right avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(200);
  });
  test("User is not able to update their metadata if the auth header is not present", async () => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
      avatarId,
    });

    expect(response.status).toBe(403);
  });
});

describe("user avatar information", () => {
  let avatarId, token, userId;
  beforeAll(async () => {
    const username = "ashutosh-" + Math.random();
    const password = "123456";
    const signupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    userId = signupRes.data.userId;
    const signinRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = signinRes.data.token;
    const avatarRes = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      name: "tommy",
    });
    avatarId = avatarRes.data.avatarId;
  });
  test("Get back avatar information for user", async () => {
    const response = await axios.get(
      `${BACKEND_URL}/api/v1/user/bulk?ids=${userId}`
    );
    expect(response.data.avatars.length).toBe(1);
    expect(response.data.avatars[0].userId).toBe(userId);
  });
  test("available avatars lists the recently created avatars", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    // expect(response.data.)
    expect(response.data.length).not.toBe(0);
    const currentAvatar = response.data.avatars.find((x) => x.id == avatarId);
    expect(currentAvatar).toBeDefined();
  });
});

describe("Space information", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  beforeAll(async () => {
    const username = "ashutosh-" + Math.random();
    const password = "123456";
    const signupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupRes.data.userId;
    const signinRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    adminToken = signinRes.data.token;
    const userSignupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    userId = signupRes.data.userId;
    const userSigninRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    userToken = signinRes.data.token;
    const element1Res = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const element2Res = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Res.data.id;
    element1Id = element2Res.data.id;
    const mapRes = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail:
          "https://w7.pngwing.com/pngs/1000/644/png-transparent-google-maps-google-search-google-map-maker-computer-icons-map-angle-search-engine-optimization-map-thumbnail.png",
        dimensions: "100x200",
        name: "test map",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 21,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 23,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapRes.data.id;
  });
  test("user is able to create a space", async () => {
    const res = await axios.post(
      `${BACKEND_URL}/api/v1/space/`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(res.status).toBe(200);
    expect(res.data.spaceId).toBeDefined();
  });

  test("user is able to create a space without mapId (empty space)", async () => {
    const res = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "empty space",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(res.data.spaceId).toBeDefined();
  });

  test("user is not able to create a space without  mapId and dimensions", async () => {
    const res = await axios.post(
      `${BACKEND_URL}/api/v1/sapce`,
      {
        name: "map without mapId and dim",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(res.status).toBe(400);
  });

  test("user is not able to delete a space that doesn't exist", async () => {
    const res = await axios.delete(
      `${BACKEND_URL}/api/v1/space/randomSapceIdThatDoesntExist`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(res.status).toBe(400);
  });

  test("user is able to delete a space that belongs to him", async () => {
    const createSpace = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const res = await axios.delete(
      `${BACKEND_URL}/api/v1/${createSpace.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });

  test("user is not able to delete a space that doesn't created by him", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const rs2 = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${rs.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    expect(re2.status).toBe(403);
  });

  test("admin has no spaces initially", async () => {
    const rs = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    expect(rs.data.sapces.length).toBe(0);
  });

  test("admin will get one space after", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const rs2 = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    const filteredSpaces = rs2.data.spaces.find(
      (x) => x.id === rs.data.spaceId
    );
    expect(filteredSpaces).toBeDefined();
    expect(rs2.data.spaces.length).toBe(1);
  });
});

describe("arena endpoints", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  beforeAll(async () => {
    const username = "ashutosh-" + Math.random();
    const password = "123456";
    const signupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupRes.data.userId;
    const signinRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    adminToken = signinRes.data.token;
    const userSignupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    userId = signupRes.data.userId;
    const userSigninRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    userToken = signinRes.data.token;
    const element1Res = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const element2Res = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Res.data.id;
    element1Id = element2Res.data.id;
    const mapRes = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail:
          "https://w7.pngwing.com/pngs/1000/644/png-transparent-google-maps-google-search-google-map-maker-computer-icons-map-angle-search-engine-optimization-map-thumbnail.png",
        dimensions: "100x200",
        name: "test map",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 21,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 23,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapRes.data.id;
  });

  test("incorrect spaceId returns 400", async () => {
    const rs = await axios.get(`${BACKEND_URL}/api/v1/space/slkdfjjsdkla`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    expect(rs.status).toBe(400);
  });

  test("correct space id returns all the elements", async () => {
    const rs = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    expect(rs.data.dimensions).toBe("100x200");
    expect(rs.data.elements.lenght).toBe(3);
  });

  test("element delete endpoint is able to delete an element", async () => {
    const rs = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    const rs2 = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${spaceId}`,
      {
        data: { id: rs.data.elements[0].id },
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const rs3 = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(rs3.data.elements.length).toBe(2);
  });

  test("adding an element fails if the element lies outside the dimensions", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        data: {
          elementId: element1Id,
          spaceId: spaceId,
          x: 1000,
          y: 2000,
        },
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(rs.status).toBe(400);
  });

  test("adding an element works as expected", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        data: {
          elementId: element1Id,
          spaceId: spaceId,
          x: 1,
          y: 2,
        },
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(rs.data.elements.length).toBe(3);
  });
});

describe("admin endpoints", () => {
  let adminToken, adminId, userToken, userId;
  beforeAll(async () => {
    const username = "ashutosh-" + Math.random();
    const password = "123456";
    const signupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupRes.data.userId;
    const signinRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    adminToken = signinRes.data.token;
    const userSignupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    userId = signupRes.data.userId;
    const userSigninRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    userToken = signinRes.data.token;
  });

  test("user is not able to hit admin endpoints", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        data: {
          imageUrl: "",
          width: 200,
          height: 100,
          static: true,
        },
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const rs2 = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/1234`,
      {
        iamgeUrl,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const rs3 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        name: "tommy",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const rs4 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "test",
        defaultElements: [],
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(rs.status).toBe(403);
    expect(rs2.status).toBe(403);
    expect(rs3.status).toBe(403);
    expect(rs4.status).toBe(403);
  });

  test("admin is able to hit all his endpoints", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        data: {
          imageUrl: "",
          width: 200,
          height: 100,
          static: true,
        },
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const rs3 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        name: "tommy",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const rs4 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "test",
        defaultElements: [],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    expect(rs.status).toBe(200);
    expect(rs3.status).toBe(200);
    expect(rs4.status).toBe(200);
  });

  test("admin is able to update the imageurl of the element", async () => {
    const rs = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        height: 1,
        width: 2,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const rs2 = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/${rs.data.id}`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    expect(rs2.status).toBe(200);
  });
});

describe("websockets tests", () => {
  let adminToken;
  let adminUserId;
  let userToken;
  let adminId;
  let userId;
  let mapId;
  let element1Id;
  let element2Id;
  let spaceId;
  let ws1;
  let ws2;
  let ws1Messages = [];
  let ws2Messages = [];
  let userX;
  let userY;
  let adminX;
  let adminY;

  function waitForAndPopLatestMessage(messageArray) {
    return new Promise((resolve) => {
      if (messageArray.length > 0) {
        resolve(messageArray.shift());
      } else {
        let interval = setInterval(() => {
          if (messageArray.length > 0) {
            resolve(messageArray.shift());
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }

  async function setupHTTP() {
    const username = "ashutosh-" + Math.random();
    const password = "123456";

    const userSignUpResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username,
        password,
        type: "user",
      }
    );
    const userSignInResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username,
        password,
      }
    );
    const adminSignUpResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username,
        password,
        type: "admin",
      }
    );
    const adminSignInResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username,
        password,
      }
    );
    userId = userSignUpResponse.data.userId;
    userToken = userSignInResponse.data.token;
    adminId = userSignUpResponse.data.userId;
    adminToken = userSignInResponse.data.token;

    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "Defaul space",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;

    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    console.log(spaceResponse.status);
    spaceId = spaceResponse.data.spaceId;
  }

  async function setupWs() {
    ws1 = new WebSocket(WS_URL);
    ws1.onmessage = (event) => {
      ws1Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws1.onopen = r;
    });
    ws2 = new Promise(WS_URL);
    ws2.onmessage = (event) => {
      ws2Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws2.onopen = r;
    });
  }

  beforeAll(async () => {
    await setupHTTP();
    await setupWs();
  });

  test("get ack for joining the space", async () => {
    ws1.send(
      JSON.stringify({
        type: "join",
        payload: {
          spaceId,
          token: adminToken,
        },
      })
    );
    const message1 = await waitForAndPopLatestMessage(ws1Messages);
    ws2.send(JSON.stringify({
      type:"join",
      payload:{
        spaceId,
        token:userToken
      }
    }))
    const message2 = await waitForAndPopLatestMessage(ws2Messages);
    const message3 = await waitForAndPopLatestMessage(ws1Messages);

    expect(message1.type).toBe("space-joined");
    expect(message2.type).toBe("space-joined");
    expect(message1.payload.users.length).toBe(0);
    expect(message2.payload.users.length).toBe(1);
    expect(message3.type).toBe("user-joined");
    expect(message3.payload.x).toBe(message2.payload.spawn.x)
    expect(message3.payload.y).toBe(message2.payload.spawn.y)
    expect(message3.payload.userId).toBe(userId)

    adminX = message1.payload.x
    adminY = message1.payload.y

    userX = message2.payload.x;
    userY = message2.payload.y;
  });

  test("user should not be able to move across the boundary of the hall",async()=>{
    ws1.send(JSON.stringify({
      type:"move",
      payload:{
        x:1000,
        y:2000
      }
    }))
    const msg = await waitForAndPopLatestMessage(ws1Messages);
    expect(msg.type).toBe("movement-rejected");
    expect(msg.payload.x).tobe(adminX)
    expect(msg.payload.y).tobe(adminY)
  })

  test("user should not be able to move two blocks at a time",async()=>{
    ws1.send(JSON.stringify({
      type:"move",
      payload:{
        x:adminX+2,
        y:adminY
      }
    }))
    const message = await waitForAndPopLatestMessage(ws1Messages);
    expect(message.type).tobe("movement-rejected");
    expect(message.paylaod.x).tobe(adminX);
    expect(message.paylaod.y).tobe(adminY);
  })

  test("other users in the room should be notified of the other users movement",async()=>{
    ws1.send(JSON.stringify({
      type:"move",
      payload:{
        x:adminX+1,
        y:adminY
      }
    }))
    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(message.type).tobe("movement");
    expect(message.paylaod.x).tobe(adminX+1);
    expect(message.paylaod.y).tobe(adminY);
  })

  test("if a user leaves other users recieves a leave event",async()=>{
    ws1.close();
    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(message.type).tobe("user-left")
    expect(message.payload.userId).tobe(adminId)
  })
});
