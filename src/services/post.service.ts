import * as db from "../config/database";

export const findAllPosts = (userId?: number) => {
  if (userId) {
    return db.posts.filter((post) => post.userId === userId);
  }
  return db.posts;
};
export const findPostById = (postId: number) => {
  return db.posts.find((post) => post.id === postId);
};
export const createPost = (post: Partial<db.Post>) => {
  const newPost: Partial<db.Post> = {
    id: db.posts[db.posts.length - 1].id + 1,
    userId: post.userId,
    title: post.title,
    content: post.content,
  };
  db.posts.push(newPost as db.Post);
  return db.posts[db.posts.length - 1];
};
export const updatePostById = (postId: number, post: Partial<db.Post>) => {
  const postToUpdate = db.posts.find((post) => post.id === postId);
  const postToUpdateIndex = db.posts.findIndex((post) => post.id === postId);
  const updatedPost: Partial<db.Post> = {
    id: postToUpdate?.id,
    userId: postToUpdate?.userId,
    title: post.title ? post.title : postToUpdate?.title,
    content: post.content ? post.content : postToUpdate?.content,
  };
  db.posts.splice(postToUpdateIndex, 1, updatedPost as db.Post);
  return db.posts[postToUpdateIndex];
};
export const deletePostById = (postId: number) => {
  const postToUpdateIndex = db.posts.findIndex((post) => post.id === postId);
  const deletedPost = db.posts.splice(postToUpdateIndex, 1);
  return deletedPost;
};
