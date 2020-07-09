let http = require('http');
let EventEmitter = require('events')
let context = require('./context')
let request = require('./request')
let response = require('./response')
let Stream = require('stream');

class Koa extends EventEmitter {
    constructor() {
        super();
        this.middlewares = [] // 需要一个数组将每个中间件按顺序存放起来
        this.context = context // 将三个模块保存，全局的放到实例上
        this.request = request
        this.response = response
    }
    use(fn) {
        // this.fn = fn;
        this.middlewares.push(fn);
    }

    compose(middlewares, ctx) {
        function dispatch(index) {
            if (index === middlewares.length) {
                return Promise.resolve();
            }
            let middleware = middlewares[index];
            return Promise.resolve(middleware(ctx, () => dispatch(index + 1)))
        }
        return dispatch(0);
    }

    createContext(req, res) {
        const ctx = Object.create(this.context);
        const request = ctx.request = Object.create(this.request);
        const response = ctx.response = Object.create(this.response);

        ctx.req = request.req = response.req = req;
        ctx.res = request.res = response.res = res;

        request.ctx = response.ctx = ctx;
        request.response = response;
        response.request = request;
        return ctx;
    }

    handleRequest = async (req, res) => {
        let ctx = this.createContext(req, res);
        await this.compose(this.middlewares, ctx);
        if (typeof ctx.body == 'object') {
            res.setHeader('Content-Type', 'application/json;charset=utf8')
            res.end(JSON.stringify(ctx.body))
        } else if (ctx.body instanceof Stream){ // 如果是流
            ctx.body.pipe(res)
        }
        else if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) { // 如果是字符串或buffer
            res.setHeader('Content-Type', 'text/html;charset=utf8')
            res.end(ctx.body)
        } else {
            res.end('Not found')
        }
    }

    listen(...args) {
        let server = http.createServer(this.handleRequest);
        server.listen(...args);
    }
}

module.exports = Koa