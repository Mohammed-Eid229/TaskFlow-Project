// import api from "./api"

// export const login = (data) => api.post("/auth/login", data)

// export const register = (data) => api.post("/auth/register", data)


export const login = async (data) => {
  console.log("FAKE LOGIN:", data)

  const fakeUser = {
    name: "Test User",
    email: data.email,
  }

  localStorage.setItem("token", "fake-token")
  localStorage.setItem("user", JSON.stringify(fakeUser))

  return {
    data: {
      success: true,
      user: fakeUser,
      token: "fake-token",
    },
  }
}

export const register = async (data) => {
  console.log("FAKE REGISTER:", data)

  const fakeUser = {
    name: data.name,
    email: data.email,
  }

  localStorage.setItem("token", "fake-token")
  localStorage.setItem("user", JSON.stringify(fakeUser))

  return {
    data: {
      success: true,
      user: fakeUser,
      token: "fake-token",
    },
  }
}