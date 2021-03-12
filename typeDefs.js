const { gql } = require('apollo-server-express');

const typeDefs = gql`
type Query {
    info(name: String!): String!
}

type user {
    name: String
    email: String!
    password: String!
}

type Mutation {
    registerUser(name: String!, email: String!, password: String!): String!
    loginUser(email: String!, password: String!): String!
}
`;

module.exports = { typeDefs };