export interface User {
  id: Number;
  name: string;
  username: string;
  email: string;
}
export interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
}
export interface Comment {
  id: number;
  userId: number;
  postId: number;
  body: string;
}

export type Users = User[];
export type Posts = Post[];
export type Comments = Comment[];

export const users: Users = [
  {
    id: 1,
    name: "Carey",
    username: "cyare23",
    email: "cy23@example.com",
  },
  {
    id: 2,
    name: "Mikoto",
    username: "Miiko",
    email: "mikoto_u@example.com",
  },
  {
    id: 3,
    name: "Ronald",
    username: "RonRonRon",
    email: "mronald@example.com",
  },
];

export const posts: Posts = [
  {
    id: 1,
    userId: 1,
    title: "est et quae odit qui non",
    content:
      "similique esse doloribus nihil accusamus\nomnis dolorem fuga consequuntur reprehenderit fugit recusandae temporibus\nperspiciatis cum ut laudantium\nomnis aut molestiae vel vero",
  },
  {
    id: 2,
    userId: 1,
    title: "quasi id et eos tenetur aut quo autem",
    content:
      "eum sed dolores ipsam sint possimus debitis occaecati\ndebitis qui qui et\nut placeat enim earum aut odit facilis\nconsequatur suscipit necessitatibus rerum sed inventore temporibus consequatur",
  },
  {
    id: 3,
    userId: 1,
    title: "delectus ullam et corporis nulla voluptas sequi",
    content:
      "non et quaerat ex quae ad maiores\nmaiores recusandae totam aut blanditiis mollitia quas illo\nut voluptatibus voluptatem\nsimilique nostrum eum",
  },
  {
    id: 4,
    userId: 2,
    title: "iusto eius quod necessitatibus culpa ea",
    content:
      "odit magnam ut saepe sed non qui\ntempora atque nihil\naccusamus illum doloribus illo dolor\neligendi repudiandae odit magni similique sed cum maiores",
  },
  {
    id: 5,
    userId: 2,
    title: "a quo magni similique perferendis",
    content:
      "alias dolor cumque\nimpedit blanditiis non eveniet odio maxime\nblanditiis amet eius quis tempora quia autem rem\na provident perspiciatis quia",
  },
  {
    id: 6,
    userId: 2,
    title: "ullam ut quidem id aut vel consequuntur",
    content:
      "debitis eius sed quibusdam non quis consectetur vitae\nimpedit ut qui consequatur sed aut in\nquidem sit nostrum et maiores adipisci atque\nquaerat voluptatem adipisci repudiandae",
  },
  {
    id: 7,
    userId: 3,
    title: "doloremque illum aliquid sunt",
    content:
      "deserunt eos nobis asperiores et hic\nest debitis repellat molestiae optio\nnihil ratione ut eos beatae quibusdam distinctio maiores\nearum voluptates et aut adipisci ea maiores voluptas maxime",
  },
  {
    id: 8,
    userId: 3,
    title: "qui explicabo molestiae dolorem",
    content:
      "rerum ut et numquam laborum odit est sit\nid qui sint in\nquasi tenetur tempore aperiam et quaerat qui in\nrerum officiis sequi cumque quod",
  },
  {
    id: 9,
    userId: 3,
    title: "magnam ut rerum iure",
    content:
      "ea velit perferendis earum ut voluptatem voluptate itaque iusto\ntotam pariatur in\nnemo voluptatem voluptatem autem magni tempora minima in\nest distinctio qui assumenda accusamus dignissimos officia nesciunt nobis",
  },
];

export const comments: Comments = [];
