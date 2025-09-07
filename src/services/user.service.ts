import * as db from "../config/database";

export const findAllUsers = () => {
  return db.users;
};
export const findUser = (data: { username?: string; email?: string }) => {
  let result = null;
  if (data.username) {
    result = db.users.find(
      (user) =>
        user.username.toString().trim().toLowerCase() ===
        data.username?.toString().trim().toLowerCase()
    );
    return result;
  }
  if (data.email) {
    result = db.users.find(
      (user) =>
        user.email.trim().toLowerCase() === data.email?.trim().toLowerCase()
    );
    return result;
  }
  return result;
};
export const findUserById = (userId: number) => {
  return db.users.find((user) => user.id === userId);
};
export const createUser = (user: Partial<db.User>) => {
  const newUser: Partial<db.User> = {
    id: db.users[db.users.length - 1].id + 1,
    username: user.username,
    name: user.name,
    email: user.email,
  };
  db.users.push(newUser as db.User);
  return db.users[db.users.length - 1];
};
export const updateUserById = (userId: number, user: Partial<db.User>) => {
  const userToUpdate = db.users.find((user) => user.id === userId);
  const userToUpdateIndex = db.users.findIndex((user) => user.id === userId);
  const updatedUser: Partial<db.User> = {
    id: userToUpdate?.id,
    name: user.name ? user.name : userToUpdate?.name,
    username: user.username ? user.name : userToUpdate?.username,
    email: user.email ? user.email : userToUpdate?.email,
  };
  db.users.splice(userToUpdateIndex, 1, updatedUser as db.User);
  return db.users[userToUpdateIndex];
};
export const deleteUserById = (userId: number) => {
  const userToUpdateIndex = db.users.findIndex((user) => user.id === userId);
  const deletedUser = db.users.splice(userToUpdateIndex, 1);
  return deletedUser;
};
