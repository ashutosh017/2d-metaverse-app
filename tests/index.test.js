const axios2 = require("axios")

const BACKEND_URL = "http://localhost:3000"
const WS_URL = "ws://localhost:3001"

const axios = {
    post: async(...args)=>{
        try {
            const res = await axios2.post(...args);
            return res;
        } catch (error) {
            return error.response;
        }
    },
    put: async(...args)=>{
        try {
            const res = await axios2.put(...args);
            return res;
        } catch (error) {
            return error.response;
        }
    },
    get: async(...args)=>{
        try {
            const res = await axios2.get(...args);
            return res;
        } catch (error) {
            return error.response;
        }
    },
    delete: async(...args)=>{
        try {
            const res = await axios2.delete(...args);
            return res;
        } catch (error) {
            return error.response;
        }
    },
}

describe("Authentication",()=>{
    test("User is able to sign up only once",async()=>{
        const username = "ashutosh" + Math.random() //ashutosh0.12342
        const password = "123456";
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,password,type:"admin"
        })
        expect(response.status).toBe(200);
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,password,type:"admin"
        })
        expect(response.status).toBe(400);

    })
    test("signup request fails when username is empty",async()=>{
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            password,type:"admin"
        })
        expect(response.status).toBe(400);
    })
    test("Signin succeeds if the username and password is correct", async()=>{
        const username = "ashutosh"+Math.random();
        const password = "123456";
        await axios.post(`${BACKEND_URL}/api/v1/signup`,{username,password,type:"admin"});
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            username,password,type:"admin"
        })
        expect(response.status).toBe(200);
    })
    test('Signin fails if the username and password are incorrect', async() => {
        const username = "ashutosh"+Math.random();
        const password = "123456"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            role: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUsername",
            password
        })

        expect(response.status).toBe(403)
    })
})

describe("user metadata endpoint", ()=>{
    let token = "";
    let avtarId = "";
    beforeAll(async()=>{
        const username = "ashutosh"+Math.random();
        const password = "123456";
        await axios.post(`${BACKEND_URL}/api/v1/signup`,{username,password,type:"admin"});
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`,{username,password,type:"admin"});
        token = response.data.token

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
             "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
             "name": "Timmy"
         }, {
             headers: {
                 authorization: `Bearer ${token}`
             }
         })
         console.log("avatarresponse is " + avatarResponse.data.avatarId)
 
         avatarId = avatarResponse.data.avatarId;

    })
    test("User cant update their metadata with a wrong avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "123123123"
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User can update their metadata with the right avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200)
    })
    test("User is not able to update their metadata if the auth header is not present", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })

        expect(response.status).toBe(403)
    })
})