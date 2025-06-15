// <pre>
/**
 * 全域文件用途批量检测工具
 * 基于MediaWiki GlobalUsage扩展的API
 * 可以批量检测文件在Wiki农场中的使用情况
 * 参考文档：https://www.mediawiki.org/wiki/Extension:GlobalUsage
 */

(function() {

    // 创建全局命名空间
    window.GlobalUsageChecker = window.GlobalUsageChecker || {};

    // 主配置
    GlobalUsageChecker.config = {
        apiUrl: mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/api.php',
        pageTitle: 'MassGlobalUsageChecker',
        pageAliases: ['批量检测全域文件用途'],
        batchSize: (mw.config.get('wgUserGroups') || []).some(g => ['sysop', 'bot' ].includes(g)) ? 500 : 50, // 根据用户组确定批处理大小
        maxResults: (mw.config.get('wgUserGroups') || []).some(g => ['sysop', 'bot'].includes(g)) ? 5000 : 500, // 根据用户组确定最大结果数量
        version: '1.3.0' // 版本号 - 更新为批量请求
    };

    // 工具初始化
    GlobalUsageChecker.init = function() {
        // 检查是否在特殊页面路径下
        var title = mw.config.get('wgTitle');
        var isSpecialPage = mw.config.get('wgNamespaceNumber') === -1;
        
        if (isSpecialPage && (title === GlobalUsageChecker.config.pageTitle || 
            GlobalUsageChecker.config.pageAliases.indexOf(title) !== -1)) {
            // 创建界面
            GlobalUsageChecker.createInterface();
            // 绑定事件
            GlobalUsageChecker.bindEvents();
        } else {
            // 添加到工具箱
            GlobalUsageChecker.addToToolbox();
        }
    };

    // 添加到工具箱
    GlobalUsageChecker.addToToolbox = function() {
        $(function() {
            var toolboxLink = $('<li id="t-globalusagechecker"><a href="/Special:' + 
                GlobalUsageChecker.config.pageTitle + '">全域文件用途检测</a></li>');
            $('#p-tb ul').append(toolboxLink);
        });
    };

    // 创建界面
    GlobalUsageChecker.createInterface = function() {
        // 修改页面标题
        document.title = "全域文件用途检测 - 萌娘共享";
        $('h1.firstHeading').text('Special:全域文件用途检测');
        
        // 清空内容区域并添加我们的界面
        $('#mw-content-text').empty().append(
            $('<div id="globalusage-checker">')
            .append('<h2>全域文件用途检测工具 <small>v' + GlobalUsageChecker.config.version + '</small></h2>')
            .append('<p>此工具可以批量检测文件在萌娘百科各站中的使用情况。请在下方输入文件名（每行一个，可以包含或不包含File:前缀）</p>')
            .append('<div class="mw-ui-message mw-ui-message-notice">' +
                '<p><strong>提示：</strong>不建议一次检测过多文件，以免被WAF！</p>' +
                '</div>')
            .append('<textarea id="file-list" rows="10" style="width: 100%;" placeholder="例如：\nExample.jpg\nFile:Logo.png\n..."></textarea>')
            .append('<div class="options-panel" style="margin: 10px 0;">' +
                '<label><input type="checkbox" id="filter-local" checked> 排除本地Wiki使用</label>' +
                '<label style="margin-left: 15px;">每个文件最多显示 <input type="number" id="result-limit" value="' + GlobalUsageChecker.config.maxResults + '" style="width: 60px;"> 个结果</label>' +
                '</div>')
            .append('<button id="start-check" class="mw-ui-button mw-ui-progressive">开始检测</button>')
            .append('<div id="results-container" style="margin-top: 20px;"></div>')
        );
    };

    // 绑定事件
    GlobalUsageChecker.bindEvents = function() {
        $('#start-check').on('click', function() {
            GlobalUsageChecker.startCheck();
        });
    };

    // 开始检测
    GlobalUsageChecker.startCheck = function() {
        var fileList = $('#file-list').val().split('\n').filter(function(file) {
            return file.trim() !== '';
        });

        if (fileList.length === 0) {
            mw.notify('请输入至少一个文件名', {type: 'error'});
            return;
        }

        // 清空结果容器
        var $resultsContainer = $('#results-container').empty()
            .append('<div class="progress-info">正在检测，请稍候...</div>')
            .append('<div class="progress-bar" style="height: 20px; background-color: #eaecf0; margin-top: 10px;">' +
                '<div class="progress" style="height: 100%; width: 0; background-color: #36c;"></div>' +
                '</div>');

        // 获取选项
        var filterLocal = $('#filter-local').is(':checked') ? 1 : 0;
        var resultLimit = parseInt($('#result-limit').val()) || GlobalUsageChecker.config.maxResults;

        // 处理文件列表
        var totalFiles = fileList.length;
        var processedFiles = 0;
        var results = {};

        // 批量处理文件，每次最多处理配置的数量
        var batchSize = GlobalUsageChecker.config.batchSize; // 使用配置的批处理大小
        
        function processNextBatch() {
            if (fileList.length === 0) {
                // 所有文件处理完毕，显示结果
                GlobalUsageChecker.displayResults(results);
                return;
            }

            // 获取下一批文件（最多50个）
            var batch = fileList.splice(0, batchSize);
            var batchCount = batch.length;
            
            // 格式化文件名（添加File:前缀）
            var formattedBatch = batch.map(function(filename) {
                return !filename.match(/^File:/i) ? 'File:' + filename : filename;
            });
            
            // 更新状态信息
            $('.progress-info').text('正在检测: ' + (processedFiles + 1) + '-' + 
                                   (processedFiles + batchCount) + '/' + totalFiles + 
                                   ' (批量请求 ' + batchCount + ' 个文件)');

            // 批量处理文件
            GlobalUsageChecker.checkFileUsage(formattedBatch, filterLocal, resultLimit)
                .done(function(data) {
                    // 处理返回的数据（包含多个文件的结果）
                    if (data.query && data.query.pages) {
                        // 遍历返回的页面数据
                        Object.keys(data.query.pages).forEach(function(pageId) {
                            var page = data.query.pages[pageId];
                            var title = page.title;
                            
                            // 为每个文件存储结果
                            var fileResult = {};
                            fileResult.query = { pages: {} };
                            fileResult.query.pages[pageId] = page;
                            results[title] = fileResult;
                        });
                    }
                    
                    // 更新处理进度
                    processedFiles += batchCount;
                    var progress = (processedFiles / totalFiles) * 100;
                    $('.progress').css('width', progress + '%');
                })
                .fail(function() {
                    // 处理失败时，为批次中的每个文件添加错误信息
                    formattedBatch.forEach(function(filename) {
                        results[filename] = {error: '检测失败'};
                    });
                    
                    processedFiles += batchCount;
                    var progress = (processedFiles / totalFiles) * 100;
                    $('.progress').css('width', progress + '%');
                })
                .always(function() {
                    // 处理下一批文件
                    setTimeout(processNextBatch, 1000); // 添加延迟，避免请求过于频繁
                });
        }

        // 开始处理第一批文件
        processNextBatch();
    };

    // 检查多个文件的使用情况（最多50个）
    GlobalUsageChecker.checkFileUsage = function(filenames, filterLocal, limit) {
        // 如果是字符串（单个文件名），转换为数组
        if (typeof filenames === 'string') {
            filenames = [filenames];
        }
        
        // 将文件名数组转换为以|分隔的字符串
        var titlesParam = filenames.join('|');
        
        return $.ajax({
            url: GlobalUsageChecker.config.apiUrl,
            method: 'POST', // 新增POST方法
            data: {
                action: 'query',
                prop: 'globalusage',
                titles: titlesParam,
                gufilterlocal: filterLocal,
                gulimit: limit,
                guprop: 'url|pageid|namespace',
                format: 'json'
            },
            dataType: 'json',
            cache: false,
            traditional: true // 添加传统序列化方式
        });
    };

    // 显示结果
    GlobalUsageChecker.displayResults = function(results) {
        var $resultsContainer = $('#results-container').empty();
        
        // 添加结果摘要
        var totalFiles = Object.keys(results).length;
        var totalUsages = 0;
        var filesWithUsage = 0;
        
        Object.keys(results).forEach(function(filename) {
            var result = results[filename];
            if (!result.error) {
                var pages = result.query && result.query.pages ? result.query.pages : {};
                var pageId = Object.keys(pages)[0];
                var page = pageId ? pages[pageId] : null;
                
                if (page && pageId !== '-1' && page.globalusage) {
                    var usageCount = page.globalusage.length;
                    totalUsages += usageCount;
                    if (usageCount > 0) {
                        filesWithUsage++;
                    }
                }
            }
        });
        
        $resultsContainer.append(
            $('<div class="result-summary" style="margin-bottom: 15px;">')
            .append('<h3>检测结果摘要</h3>')
            .append('<p>共检测 <strong>' + totalFiles + '</strong> 个文件，' + 
                   '其中 <strong>' + filesWithUsage + '</strong> 个文件有使用记录，' +
                   '总共 <strong>' + totalUsages + '</strong> 处使用位置。</p>')
        );
        
        // 创建结果表格
        var $table = $('<table class="wikitable sortable" style="width: 100%;">')
            .append('<thead><tr>' +
                '<th>文件名</th>' +
                '<th>使用次数</th>' +
                '<th>详细信息</th>' +
                '</tr></thead>');
        
        var $tbody = $('<tbody>').appendTo($table);
        
        // 处理每个文件的结果
        Object.keys(results).forEach(function(filename) {
            var result = results[filename];
            var $row = $('<tr>');
            
            // 文件名列 - 添加链接到文件页面
            var fileLink = mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/' + filename;
            $row.append('<td><a href="' + fileLink + '" target="_blank">' + filename + '</a></td>');
            
            // 如果有错误
            if (result.error) {
                $row.append('<td colspan="2" class="error">' + result.error + '</td>');
                $tbody.append($row);
                return;
            }
            
            // 获取页面ID和全域使用信息
            var pages = result.query && result.query.pages ? result.query.pages : {};
            var pageId = Object.keys(pages)[0];
            var page = pageId ? pages[pageId] : null;
            
            if (!page || pageId === '-1') {
                $row.append('<td colspan="2" class="error">文件不存在</td>');
                $tbody.append($row);
                return;
            }
            
            var globalUsage = page.globalusage || [];
            
            // 使用次数列
            $row.append('<td>' + globalUsage.length + '</td>');
            
            // 详细信息列
            var $details = $('<td>');
            
            if (globalUsage.length === 0) {
                $details.text('无使用记录');
            } else {
                var $usageList = $('<ul>');
                
                globalUsage.forEach(function(usage) {
                    var wiki = usage.wiki || '未知Wiki';
                    var namespace = usage.ns_text || '';
                    var title = usage.title || '未知页面';
                    var url = usage.url || '#';
                    
                    var fullTitle = namespace ? namespace + ':' + title : title;
                    
                    $usageList.append(
                        $('<li>')
                        .append(
                            $('<a>')
                            .attr('href', url)
                            .attr('target', '_blank')
                            .text(fullTitle + ' (' + wiki + ')')
                        )
                    );
                });
                
                $details.append($usageList);
            }
            
            $row.append($details);
            $tbody.append($row);
        });
        
        $resultsContainer.append($table);
        
        // 尝试初始化排序功能
        if (typeof mw.loader !== 'undefined') {
            mw.loader.load('jquery.tablesorter');
            setTimeout(function() {
                $table.tablesorter();
            }, 100);
        }
    };

    // 在DOM准备好后初始化
    $(function() {
        GlobalUsageChecker.init();
    });

})();