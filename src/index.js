import Koa from "koa";
import dotenv from "dotenv";
import http2 from "http2";
import fs from "fs";
import { koaBody } from "koa-body";
import Router from 'koa-router'

dotenv.config({ path: "./development.env" });

const app = new Koa();
const router = new Router();
const options = {
  key: fs.readFileSync("./src/certs/private.key"),
  cert: fs.readFileSync("./src/certs/certificate.crt"),
  allowHTTP1: true,
};

app.use(koaBody({
  multipart: true,
  json: true,
  form: true,
  text: true,
  encoding: 'utf-8',
}));
app.use(async (ctx, next) => {
  await next();
});

router.get("/user", async (ctx) => {
  const parms = ctx.query;//parms url
  ctx.body = "Hello user!";
  ctx.status = 200;
});

router.get("/user/:username", async (ctx, next) => {
  const parms_query = ctx.query;//params url query
  const parms_path = ctx.params;//params url path

  if( !!parms_path.username ){
    await next();
  }
  ctx.body = ctx.result;
  ctx.status = 200;
}, async ctx => {
  const user_state = ctx.cookies.get('login');
  if(user_state){
    ctx.result = { msg: `welcome ${ctx.params.username}` }
  }else{
    ctx.result = { msg: 'please login!' }
  }
}
);

router.post('/user', async (ctx, next) => {
  const parms = ctx.request.body; //parms body/
  if(!!parms.username && !!parms.password){
    await next();
  }
  ctx.body = ctx.result;
}, async (ctx, next) => {
  const { username, password } = ctx.request.body;
  if(username === 'koa_user' && password === '12345'){
    ctx.result = { msg: 'user found!' }
    await next();
  }else{
    ctx.result = { msg: 'user not found!' }
  }
}, async ctx => {
  ctx.cookies.set('login', true, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60
  });
  ctx.result.res_cookie = 'Defined cookie';
}
);

app.use(router.routes()).use(router.allowedMethods());
http2
  .createSecureServer(options, app.callback())
  .listen(process.env.PORT || 3000, () =>
    console.log(`Server running on port: ${process.env.PORT || 3000}`)
);
