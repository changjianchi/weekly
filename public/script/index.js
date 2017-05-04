$(function () {
    var $container = $('.container');
    var $slidebar = $container.find('.slidebar');
    var $new_info = $container.find('.new_info');
    var $label = $container.find('.label');
    var $nav = $container.find('.nav');
    var $docx_body = $container.find('.markdown-body');
    var $docx_marked = $container.find('.docx_marked');
    var $textarea = $container.find('.docx_textarea');
    var $content_foot = $container.find('.content_foot');
    var $copy = $container.find('.content_copy');
    var $save = $container.find('.content_save');
    
    var winHeight = $(window).height();
    var md = {};
    md.list = [];
    md.coder = [];
    md.flag = false;

    console.log(md);

    $docx_body.css('height', winHeight - 100 + 'px');

    $nav.on('mouseover mouseout', '.btn', function (event) {
        if (event.type === 'mouseover') {
            $(this).addClass('btn_active');
        }
        else {
            $(this).removeClass('btn_active');
        }
    });

    $container.on('mouseover mouseout', '.btn', function (event) {
        if (event.type === 'mouseover') {
            $(this).addClass('newmd_active');
        }
        else {
            $(this).removeClass('newmd_active');
        }
    });

    var setIds = function (id, link, type) {
        var flag = false;
        md.list_index = 0;
        var defer = $.Deferred();

        if (md.list.length) {
            md.list.forEach(function (val, index) {
                if (val.ids == id) {
                    md.list_index = index;
                    flag = true;
                }
            });
        }

        if (flag) {
            if (type === 'add') {
                if ($docx_body.hasClass('markdown-body-active')) {
                    $docx_body.removeClass('markdown-body-active');
                }
                $docx_marked.append(md.list[md.list_index].data);
                md.coder.push(md.list[md.list_index].code);
            }
            else {
                if (!$docx_body.hasClass('markdown-body-active')) {
                    $docx_body.addClass('markdown-body-active');
                }
                $textarea.val(md.list[md.list_index].code);
                md.coder = [];
            }
        }
        else {
            console.log('走的是ajax', link, type);
            $.when(setMd(link)).then(function (res) {
                console.log(res, 'res');
                md.list.push({
                    "data": res.data,
                    "code": res.code,
                    "ids": id
                });

                if (type === 'add') {
                    if ($docx_body.hasClass('markdown-body-active')) {
                        $docx_body.removeClass('markdown-body-active');
                    }
                    console.log($docx_marked.length);
                    $docx_marked.append(res.data);
                    md.coder.push(res.code);
                }
                else {
                    if (!$docx_body.hasClass('markdown-body-active')) {
                        $docx_body.addClass('markdown-body-active');
                    }
                    $textarea.val(res.code);
                    md.coder = [];
                }
            }, function () {
                defer.reject();
            });
        }
        return defer.promise();
    }

    var copyMd = function () {
        $copy.zclip({
            path: 'script/ZeroClipboard.swf',
            copy: function () {
                if (md.coder.length) {
                    return md.coder.join('');
                }
            },
            afterCopy: function () {
                if (md.coder.length) {
                    alert('复制成功');
                }
            }
        })
    };

    md.copyflag = true; // 防止多次触发copyMd方法,只有为true的时候才会触发
    /**
     * [复制和保存按钮增加点击事件]
     * @param  {[type]} event) {                   var ids [description]
     * @return {[type]}        [description]
     */
    $nav.on('click', '.btn', function (event) {
        var ids = $(this).closest('li').data('id');
        var link = $(this).closest('li').find('a').attr('href');
        var defer = $.Deferred();

        $nav.find('li').removeClass('edit');

        if (!$content_foot.hasClass('show')) {
            $content_foot.addClass('show');
        }

        console.log(ids, link);
        if ($(this).hasClass('add')) {
            md.type = 'add';
            if (md.flag) {
                $docx_marked.html('');
            }
            $copy.show();
            $save.hide();
            if (md.copyflag) {
                // 复制md文件内容
                copyMd();
                md.copyflag = false;
            }
            $(this).closest('li').addClass('active');
            md.flag = false;
        }
        else {
            md.type = 'edit';
            $nav.find('li').removeClass('active');
            $(this).closest('li').addClass('edit');
            $save.show();
            $copy.hide();
            md.flag = true;
        }
        defer.resolve(setIds(ids, link, md.type));
        return defer.promise();
    });

    /**
     * [编辑文档后的保存按钮]
     * @param  {[type]} ) {                   var link [需要保存的文档地址]
     * @return {[type]}   [description]
     */
    $content_foot.on('click', '.content_save', function () {
        var link = $nav.find('.edit').find('a').attr('href');
        var text = $textarea.val();

        saveMd(link, text, function () {
            md.list = [];
            alert('保存成功');
        });
    });

    /**
     * [setMd 异步获取md文件]
     * @param {[type]} name [返回的promise状态]
     */
    var setMd = function (name) {
        var defer = $.Deferred();
        if (xhr) {
            xhr.abort();
            xhr = null;
        }
        var xhr = $.ajax({
            url: 'api/get',
            timeout: 7000,
            data: {
                name: name
            },
            beforeSend: function () {
                
            },
            success: function (res) {
                if (res && res.data && res.code) {
                    defer.resolve(res);
                }
            },
            error: function (xhr, status) {
                if (xhr && status !== 'abort') {
                    defer.reject(status);
                }
            },
            complete: function () {
                xhr = null;
            }
        });
        return defer.promise();
    };

    /**
     * [saveMd 在编辑状态下保存md文件发的异步请求]
     * @param  {[type]}   name     [请求的md文件名]
     * @param  {[type]}   data     [需要保存的内容]
     * @param  {Function} callback [请求成功后的回调函数]
     * @return {[type]}            [返回的promise状态]
     */
    var saveMd = function (name, data, callback) {
        var defer = $.Deferred();
        if (savexhr) {
            savexhr.abort();
            savexhr = null;
        }
        var savexhr = $.ajax({
            url: 'api/save',
            timeout: 7000,
            data: {
                name: name,
                data: data
            },
            beforeSend: function () {
                
            },
            success: function (res) {
                if (callback) {
                    defer.resolve(callback());
                }
                else {
                    defer.resolve();
                }
                
            },
            error: function (xhr, status) {
                if (xhr && status !== 'abort') {
                    defer.reject(status);
                }
            },
            complete: function () {
                savexhr = null;
            }
        });
        return defer.promise();
    }

    /**
     * [refreshMd 添加新的md文档后异步刷新页面，不传任何参数，只是触发后端重新渲染目录结构]
     * @return {[type]}      [返回的promise状态]
     */
    var refreshMd = function () {
        var defer = $.Deferred();
        if (xhr) {
            xhr.abort();
            xhr = null;
        }
        var xhr = $.ajax({
            url: 'api/new',
            timeout: 7000,
            beforeSend: function () {
                
            },
            success: function (res) {
                if (res && res.data) {
                    defer.resolve(res.data);
                }
            },
            error: function (xhr, status) {
                if (xhr && status !== 'abort') {
                    defer.reject(status);
                }
            },
            complete: function () {
                xhr = null;
            }
        });
        return defer.promise();
    };

    $slidebar.on('click', '.newmd_btn', function () {
        $new_info.show();
        $nav.hide();
        var $in_time = $container.find('.in_time');
        var time = setTime();
        $in_time.val(time);

        if ($docx_body.hasClass('markdown-body-active')) {
            $docx_body.removeClass('markdown-body-active');
        }

        if ($docx_body.html() != '' || $textarea.val() != '' || md.coder.length || md.list.length) {
            $docx_marked.html('');
            $textarea.val('');
            md.coder = [];
            md.list = [];
            $content_foot.removeClass('show');
        }
    });
    $slidebar.on('click', '.in_save', function (event) {
        var $this = $(event.target);
        var flag = false;
        if ($this.hasClass('btn')) {
            var htmlarr = [];
            var $adress = $(this).closest('.in_save').find('.input');
            if ($adress.val() == '') {
                $adress.addClass('tips_input');
            }
            else {
                flag = true;
                var reg = /^\//g;
                var link = '/' + $adress.val().replace(reg, '');
                console.log(link, 'link');
            }

            $.each($label, function (key, val) {
                var $input = $(val).find('.input');
                var $val = $input.val();
                if ($val != '') {
                    if (!$(val).hasClass('adress')) {
                        var $tips = $input.data('tips') + ' ';
                        if ($input.attr('data-type') === '1') {
                            var $label_title = $(val).find('.label_title');
                            $tips = $tips + $.text($label_title) + '\n\r\n\r';
                        }
                    }
                    htmlarr.push($tips + $val + '\n\r\n\r');
                }
                else if ($val == '' && ($input.data('selected') == '1')) {
                    flag = false;
                    $input.addClass('tips_input');
                }
            });
            
            if (flag) {
                saveMd(link, htmlarr.join(''), function () {
                    var defer = $.Deferred();
                    $.when(refreshMd()).then(function (res) {
                        $new_info.hide();
                        $nav.show();

                        var htmllist = setHtml(res);
                        $nav.html(htmllist);

                        // 提交成功后清空文本框内容
                        $label.find('.input').val('');
                    }, function () {
                        defer.reject();
                    });
                    
                    return defer.promise();
                });
            }
        }
    });

    var setHtml = function (data) {
        var html = data.map(function (res, index) {
            var $li = [
                '<li' + (index == 0 ? ' class="li_first"' : '') + ' data-id="' + res.id + '">',
                    '<a href="' + res.link + '">' + res.title + '</a>',
                    '<span class="btn edit">编辑</span>',
                    '<span class="btn add">添加</span>',
                '</li>'
            ].join('');
            return $li;
        }).join('');
        return html;
    };

    var setTime = function () {
        var date = new Date();
        var now_day = date.getDay();
        now_day = now_day == 0 ? 7 : now_day;
        var day = 86400000 * (now_day - 1);

        var now_date = date.toLocaleDateString();
        now_date = now_date.split('/');
        now_date = now_date.map(function (val, index) {
            return val < 10 ? '0' + val : val;
        });

        var old_date = new Date(date - day).toLocaleDateString();
        console.log(old_date, 'sss');
        old_date = old_date.split('/');
        
        old_date = old_date.map(function (val, index) {
            return val < 10 ? '0' + val : val;
        });
        
        return old_date.join('-') + '至' + now_date.join('-');
    };

    $label.on('change input', '.input', function () {
        if ($(this).hasClass('tips_input')) {
            $(this).removeClass('tips_input');
        }
    });
});
