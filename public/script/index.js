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
    var $loading = $container.find('.loading');
    var $select_wrap = $container.find('.select_wrap');
    var $example = $container.find('.example');
    
    var winHeight = $(window).height();
    var md = {};
    md.list = [];
    md.coder = [];
    md.flag = false;

    console.log(data);
    console.log(md);

    $docx_body.css('height', winHeight - 100 + 'px');

    var setHtml = function (data) {
        var html = '';
        data.forEach(function (res, index) {
            html += '<li' + (index === 0 ? ' class="li_first"' : '') + (res.link ? ' data-id="' + res.id + '"' : '') + '>';
            if (res.link) {
                html += '<div class="nav_info">';
                html +=     '<a href="' + res.link + '">' + res.title + '</a>';
                // html +=     '<span class="btn dele">删除</span>';
                html +=     '<span class="btn edit">编辑</span>';
                html +=     '<span class="btn add">添加</span>';
                html += '</div>';
            }
            else {
                html += '<div class="nav_title">' + res.title + '</div>';
                html += '<ul class="sub_nav">';
                html += setHtml(res.child);
                html += '</ul>';
            }
            html += '</li>';
        });
        return html;
    };
    var navlist = setHtml(data);
    $nav.html(navlist);

    $nav.on('click mouseover mouseout', '.nav_title', function (event) {
        if (event.type === 'click') {
            if ($(this).hasClass('focus')) {
                $(this).removeClass('focus');
                $(this).next('.sub_nav').removeClass('in');
            }
            else {
                $(this).addClass('focus');
                $(this).next('.sub_nav').addClass('in');
            }
        }
        else if (event.type === 'mouseover') {
            $(this).addClass('active');
        }
        else {
            $(this).removeClass('active');
        }
    });

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
            $.when(setMd(link)).then(function (res) {
                md.list.push({
                    "data": res.data,
                    "code": res.code,
                    "ids": id
                });

                if (type === 'add') {
                    if ($docx_body.hasClass('markdown-body-active')) {
                        $docx_body.removeClass('markdown-body-active');
                    }
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

    $nav.on('click', 'a', function (event) {
        event.preventDefault();
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
            $content_foot.removeClass('show');
            $textarea.val('');
            sett();
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
                $loading.show();
            },
            success: function (res) {
                if (res && res.data && res.code) {
                    $loading.hide();
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
                $loading.show();
            },
            success: function (res) {
                if (callback) {
                    $loading.hide();
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
    var refreshMd = function (name) {
        var defer = $.Deferred();
        if (xhr) {
            xhr.abort();
            xhr = null;
        }
        var xhr = $.ajax({
            url: 'api/new',
            timeout: 7000,
            beforeSend: function () {
                $loading.show();
            },
            success: function (res) {
                if (res && res.data) {
                    $loading.hide();
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

    $new_info.on('mouseenter mouseleave click', '.tags', function (event) {
        if (event.type === 'mouseenter') {
            $(this).addClass('focus');
        }
        else if (event.type === 'click') {
            $(this).addClass('active').siblings('.tags').removeClass('active');
            if ($(this).closest('.input').hasClass('tips_input')) {
                $(this).closest('.input').removeClass('tips_input')
            }
        }
        else {
            $(this).removeClass('focus');
        }
    });

    md.saveflag = true; // 防止多次触发copyMd方法,只有为true的时候才会触发
    $slidebar.on('click', '.newmd_btn', function () {
        $new_info.show();
        $nav.hide();
        $slidebar.addClass('active');
        $select_wrap.show();
        $example.removeClass('hide');

        if (md.saveflag) {
            setSelect();
            md.saveflag = false;
        }

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
        if ($this.hasClass('btn_save')) {
            var htmlarr = [];
            var $adress = $(this).closest('.in_save').find('.input');
            if ($adress.val() == '') {
                $adress.addClass('tips_input');
            }
            else {
                var mdreg = /\.md$/g;
                if (mdreg.test($adress.val())) {
                    flag = true;
                    var reg = /^\//g;
                    var text = '/' + $adress.val().replace(reg, '');
                    if (md.type && md.type != '') {
                        text = '/' + md.type + text;
                    }
                    var link = text;
                }
                else {
                    $adress.addClass('tips_input');
                }
            }

            $.each($label, function (key, val) {
                var $input = $(val).find('.input');
                if ($input.hasClass('status')) {
                    md.status = [];
                    $.each($input.find('.tags'), function (index, value) {
                        if ($(value).hasClass('active')) {
                            var $tips = $input.data('tips') + ' ';
                            if ($input.attr('data-type') === '1') {
                                var $label_title = $(val).find('.label_title');
                                $tips = $tips + $.text($label_title) + '\n\r\n\r';
                            }
                            htmlarr.push($tips + $.text($(value)) + '\n\r\n\r');
                            md.status[0] = 1;
                            return;
                        }
                    });
                    if (!md.status.length) {
                        flag = false;
                        $input.addClass('tips_input');
                    }
                }
                else {
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
                    else if ($val == '' && ($input.data('selected') == '1') && !$input.hasClass('status')) {
                        flag = false;
                        $input.addClass('tips_input');
                    }
                }
            });
            
            if (flag) {
                saveMd(link, htmlarr.join(''), function () {
                    sett();
                });
            }
        }
        else if ($this.hasClass('btn_chanel')) {
            hideNew();
        }
    });

    var sett = function () {
        var defer = $.Deferred();
        $.when(refreshMd()).then(function (res) {
            hideNew();

            var htmllist = setHtml(res);
            $nav.html(htmllist);
        }, function () {
            defer.reject();
        });
        
        return defer.promise();
    };

    /**
     * [hideNew 关闭新建元素]
     * @return {[type]} [description]
     */
    function hideNew () {
        $new_info.hide();
        $nav.show();
        $slidebar.removeClass('active');
        
        // 提交成功后清空文本框内容
        $label.find('.input').val('').removeClass('tips_input');
        $example.addClass('hide');
        $select_wrap.hide();

        /**
         * 关闭新建元素初始化页面加载时的样式
         */
        $nav.find('.nav_title').removeClass('focus');
        $nav.find('ul').removeClass('in');
        $nav.find('li').removeClass('active');
    };

    $label.on('change input', '.input', function () {
        if ($(this).hasClass('tips_input')) {
            $(this).removeClass('tips_input');
        }
    });

    /**
     * [$select 模拟下拉框]
     * @type {[obj]}
     */
    var setSelect = function () {
        var $select = $('.select_wrap:visible');
        $.each($select, function (key, val) {
            var $this = $(val).find('.select');
            var flag = false;

            var defaultText = $.text($this.find('.option p').eq(0));
            $this.find('.value').html(defaultText);
            
            var $valueHeight = $(val).find('.value').height();
            var $height = $(val).find('.option').height();

            $(val).css('zIndex', $select.length - key);

            $this.find('.value').on('click', function () {
                if (flag) {
                    $this.animate({
                        height: $valueHeight + 'px'
                    }, 50);
                    flag = false;
                }
                else {
                    $this.animate({
                        height: ($height + $valueHeight) + 'px'
                    }, 100);
                    flag = true;

                    setTimeout(function () {
                        $(document).one('click', function () {
                            $this.animate({
                                height: $valueHeight + 'px'
                            }, 50);
                            flag = false;
                        });
                    });
                }
            });

            $this.find('.option p').on('click mouseenter mouseleave', function (event) {
                if (event.type === 'click') {
                    if ($(this).index() === 0) {
                        md.type = '';
                    }
                    else {
                        md.type = $.text($(this));
                    }
                    $this.find('.value').html($(this).text());
                    $(this).addClass('active').siblings().removeClass('active');
                    $this.animate({
                        height: $valueHeight + 'px'
                    }, 50);
                    flag = false;
                }
                else if (event.type === 'mouseenter') {
                    $(this).addClass('hover');
                }
                else {
                    $(this).removeClass('hover');
                }
                
            });

        });
    };
});
