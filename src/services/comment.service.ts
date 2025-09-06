import * as db from "../config/database";

export const findAllComments = (userId?: number, postId?: number) => {
  if (userId && postId) {
    return db.comments.filter(
      (comment) => comment.postId === postId && comment.userId === userId
    );
  }
  if (userId) {
    return db.comments.filter((comment) => comment.userId === userId);
  }
  if (postId) {
    return db.comments.filter((comment) => comment.postId === postId);
  }
  return db.comments;
};
export const findCommentById = (commentId: number) => {
  return db.comments.find((comment) => comment.id === commentId);
};

export const createComment = (comment: Partial<db.Comment>) => {
  const newComment: Partial<db.Comment> = {
    id: db.comments[db.comments.length - 1].id + 1,
    userId: comment.userId,
    postId: comment.postId,
    body: comment.body,
  };
  db.comments.push(newComment as db.Comment);
  return db.comments[db.comments.length - 1];
};
export const updateCommentById = (
  commentId: number,
  comment: Partial<db.Comment>
) => {
  const commentToUpdate = db.comments.find(
    (comment) => comment.id === commentId
  );

  const commentToUpdateIndex = db.comments.findIndex(
    (comment) => comment.id === commentId
  );
  const updatedPost: Partial<db.Comment> = {
    id: commentToUpdate?.id,
    userId: commentToUpdate?.userId,
    postId: commentToUpdate?.postId,
    body: comment.body,
  };
  db.comments.splice(commentToUpdateIndex, 1, updatedPost as db.Comment);
  return db.comments;
};
export const deleteCommentById = (commentId: number) => {
  const postToUpdateIndex = db.comments.findIndex(
    (comment) => comment.id === commentId
  );
  db.comments.splice(postToUpdateIndex, 1);
  return db.posts;
};
