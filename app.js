/**
 * [author changjianchi]
 * @type {[type]}
 */
var express = require('express');
var fs = require('fs');
var marked = require('marked');
var template = require('art-template');
var path = require('path');
/**
 * [config 配置文件]
 * @obj {Object}
 */
var config = require('./config.json');

var dir = path.resolve(config.path);
var app = express();

// 处理模板引擎
template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/view');

app.use(express.static(config.static));
// 委托其他静态目录
app.use('/', express.static(config.path));

// 查找目录数据
app.use(function (req, res, next) {
    req.dirData = setDir(dir);
    next();
});

// 渲染模板
app.get('/', function (req, res, next) {
    res.render('./index', {
        config: config,
        data: JSON.stringify(req.dirData, null, 4),
        dirData: req.dirData
    });
});

// 异步请求md文档
app.get('/api/get', function (req, res, next) {
    var name = req.query.name;
    name = dir + name;
    var content = fs.readFileSync(name, 'utf-8');
    var htmlMd = marked(content);
    res.json({
        data: htmlMd,
        code: content
    });
});

// 保存md文件
app.get('/api/save', function (req, res, next) {
    var name = req.query.name;
    var data = req.query.data;
    name = dir + name;
    /*
    var stat = fs.existsSync(dir + '/test');
    if (stat == true) {
        console.log('这个目录存在');
    }
    else {
        console.log('这个目录不存在');
        fs.mkdirSync(dir + '/test');
    }
    */
    fs.writeFileSync(name, data);
    res.json({
        name: name,
        data: data
    });
});

// 新建md文档后异步刷新页面
app.get('/api/new', function (req, res, next) {
    var dirData = setDir(dir);
    res.json({
        data: dirData
    });
});

// 自动更新文件
app.all('/update', function (req, res, next) {
    require('child_process').exec('git pull', {
        cwd: __dirname
    }, function (err) {
        if (err) {
            res.send('update cache err: ' + err.toString());
        }
        else {
            res.send('update cache.');
        }
    });
});

app.use(function (req, res, next) {
    res.end('404');
});

var server = app.listen(config.port);

var index = 0;
var setDir = function (dir) {
    var arr = [];

    fs.readdirSync(dir).forEach(function (file) {
        var filepath = path.resolve(dir, file);
        var stat = fs.statSync(filepath);
        var flag = true;

        config.ignoredir.forEach(function (val, index) {
            if (file.indexOf(val) > -1) {
                flag = false;
            }
            return;
        });

        if (flag) {
            if (stat.isDirectory()) {
                arr.push({
                    title: file,
                    type: 'directory',
                    child: setDir(filepath)
                });
            }
            else {
                var data = fs.readFileSync(filepath, 'utf-8');
                // 把读取到的内容按行分割成数组，方便获取到第一行内容
                var lines = data.split('\n');
                var reg = /^#+\s+/g;
                var title = lines[0].replace(reg, '');

                arr.push({
                    title: title,
                    link: filepath.split('list')[1],
                    id: index,
                    filepath: filepath,
                    type: 'file'
                });
                index++;
            }
        }
    });

    return arr;
}
