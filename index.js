const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ApolloServer, gql } = require('apollo-server-express');
const { typeDefs } = require('./typeDefs');
const { resolvers } = require('./resolvers');

dotenv.config();

const startServer = async () => {
    const app = express();

    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    server.applyMiddleware({ app })

    // CONNECT TO DB
    const options = { useNewUrlParser: true, useUnifiedTopology: true };
    await mongoose.connect(process.env.MONGO_URL, options, () => {
        console.log('Connected to DB!')
    });


    app.listen({ port: 8080 }, () => {
        console.log(`server started at http://localhost:8080${ server.graphqlPath }`);
    });
}

startServer().catch(console.error);