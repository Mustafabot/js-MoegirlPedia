// 分类文件URL批量提取工具
// 基于MediaWiki API的categorymembers和imageinfo查询

(function() {
    // 创建全局命名空间
    window.CategoryFileUrlExtractor = window.CategoryFileUrlExtractor || {};

    // 主配置
    CategoryFileUrlExtractor.config = {
        apiUrl: mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/api.php',
        batchSize: 50, // 每次处理的文件数量
        version: '1.0.0',
        pageTitle: 'CategoryFileUrlExtractor',
        pageAliases: ['分类文件URL提取工具']
    };

    // 工具初始化
    CategoryFileUrlExtractor.init = function() {
        // 检查是否在特殊页面路径下
        var title = mw.config.get('wgTitle');
        var isSpecialPage = mw.config.get('wgNamespaceNumber') === -1;
        
        if (isSpecialPage && (title === CategoryFileUrlExtractor.config.pageTitle ||
            CategoryFileUrlExtractor.config.pageAliases.indexOf(title) !== -1)) {
            // 创建界面
            CategoryFileUrlExtractor.createInterface();
            // 绑定事件
            CategoryFileUrlExtractor.bindEvents();
        } else {
            // 添加到工具箱
            CategoryFileUrlExtractor.addToToolbox();
        }
    };

    // 创建界面
    CategoryFileUrlExtractor.createInterface = function() {
        $('#mw-content-text').empty().append(
            $('<div id="category-file-extractor">')
            .append('<h2>分类文件URL提取工具 <small>v' + CategoryFileUrlExtractor.config.version + '</small></h2>')
            .append('<p>请输入分类名称（例如：Category:萌娘百科图片）</p>')
            .append('<input type="text" id="category-name" style="width: 300px;" placeholder="分类名称">')
            .append('<button id="start-extract" class="mw-ui-button mw-ui-progressive">开始提取</button>')
            .append('<div id="results-container" style="margin-top: 20px;"><textarea id="url-list" rows="20" style="width: 100%;" readonly></textarea></div>')
        );
    };

    // 绑定事件
    CategoryFileUrlExtractor.bindEvents = function() {
        $('#start-extract').on('click', function() {
            var categoryName = $('#category-name').val().trim();
            if (!categoryName) {
                mw.notify('请输入分类名称', {type: 'error'});
                return;
            }
            CategoryFileUrlExtractor.startExtract(categoryName);
        });
    };

    // 开始提取
    CategoryFileUrlExtractor.startExtract = function(categoryName) {
        $('#results-container').empty()
            .append('<div class="progress-info">正在处理，请稍候...</div>')
            .append('<textarea id="url-list" rows="20" style="width: 100%;" readonly></textarea>');

        // 获取分类下的所有文件
        CategoryFileUrlExtractor.getCategoryFiles(categoryName)
            .then(function(files) {
                // 批量获取文件URL
                return CategoryFileUrlExtractor.getFileUrls(files);
            })
            .then(function(urls) {
                // 显示结果
                $('#url-list').val(urls.join('\n'));
                $('.progress-info').text('处理完成！共找到 ' + urls.length + ' 个文件URL');
            })
            .fail(function(error) {
                mw.notify('处理失败: ' + error, {type: 'error'});
                $('.progress-info').text('处理失败');
            });
    };

    // 获取分类下的文件列表
    CategoryFileUrlExtractor.getCategoryFiles = function(categoryName) {
        var deferred = $.Deferred();
        var files = [];
        var continueParam = '';

        function fetchBatch() {
            $.ajax({
                url: CategoryFileUrlExtractor.config.apiUrl,
                data: {
                    action: 'query',
                    list: 'categorymembers',
                    cmtitle: categoryName,
                    cmnamespace: 6, // 文件命名空间
                    cmprop: 'title',
                    cmlimit: CategoryFileUrlExtractor.config.batchSize,
                    cmcontinue: continueParam || undefined,
                    format: 'json'
                },
                dataType: 'json'
            }).done(function(data) {
                if (data.query && data.query.categorymembers) {
                    files = files.concat(data.query.categorymembers.map(function(member) {
                        return member.title;
                    }));

                    if (data.continue && data.continue.cmcontinue) {
                        continueParam = data.continue.cmcontinue;
                        setTimeout(fetchBatch, 1000); // 延迟避免请求过快
                    } else {
                        deferred.resolve(files);
                    }
                } else {
                    deferred.reject('无法获取分类文件列表');
                }
            }).fail(function() {
                deferred.reject('请求分类文件列表失败');
            });
        }

        fetchBatch();
        return deferred.promise();
    };

    // 批量获取文件URL
    CategoryFileUrlExtractor.getFileUrls = function(files) {
        var deferred = $.Deferred();
        var urls = [];
        var batchSize = CategoryFileUrlExtractor.config.batchSize;
        var processed = 0;

        function processBatch() {
            if (processed >= files.length) {
                deferred.resolve(urls);
                return;
            }

            var batch = files.slice(processed, processed + batchSize);
            processed += batch.length;

            $.ajax({
                url: CategoryFileUrlExtractor.config.apiUrl,
                data: {
                    action: 'query',
                    prop: 'imageinfo',
                    titles: batch.join('|'),
                    iiprop: 'url',
                    format: 'json'
                },
                dataType: 'json'
            }).done(function(data) {
                if (data.query && data.query.pages) {
                    Object.values(data.query.pages).forEach(function(page) {
                        if (page.imageinfo && page.imageinfo[0]) {
                            urls.push(page.imageinfo[0].url);
                        }
                    });
                }
                setTimeout(processBatch, 1000); // 延迟避免请求过快
            }).fail(function() {
                deferred.reject('获取文件URL失败');
            });
        }

        processBatch();
        return deferred.promise();
    };

    // 添加到工具箱
    CategoryFileUrlExtractor.addToToolbox = function() {
        $(function() {
            var toolboxLink = $('<li id="t-categoryfileextractor"><a href="/Special:' +
                CategoryFileUrlExtractor.config.pageTitle + '">分类文件URL提取</a></li>');
            $('#p-tb ul').append(toolboxLink);
        });
    };

    // 在DOM准备好后初始化
    $(function() {
        CategoryFileUrlExtractor.init();
    });
})();