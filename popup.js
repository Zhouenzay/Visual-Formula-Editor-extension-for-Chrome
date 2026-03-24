// 等待 MathLive 库加载完成
function waitForMathLive(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
        console.log(`检查库加载 - 尝试 ${attempts + 1}/${maxAttempts}`);
        console.log("MathLive:", typeof window.MathLive);
        
        if (typeof window.MathLive !== 'undefined') {
            console.log('✓ MathLive 已加载');
            callback();
            return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            setTimeout(check, 100);
        } else {
            console.error('✗ MathLive 加载超时');
            document.getElementById('preview').innerHTML = '<span style="color:red;">错误：MathLive 库加载失败</span>';
        }
    }
    
    check();
}

// 保存公式到存储
function saveFormula(latex) {
    try {
        chrome.storage.sync.set({ 'savedFormula': latex }, () => {
            console.log('✓ 公式已保存:', latex);
        });
    } catch (e) {
        console.error('保存公式失败:', e);
    }
}

// 从存储加载公式
function loadFormula(callback) {
    try {
        chrome.storage.sync.get(['savedFormula'], (result) => {
            const savedFormula = result.savedFormula || '';
            console.log('✓ 加载已保存的公式:', savedFormula);
            callback(savedFormula);
        });
    } catch (e) {
        console.error('加载公式失败:', e);
        callback('');
    }
}

// 初始化应用
function initApp() {
    const mathField = document.getElementById("mathField");
    const preview = document.getElementById("preview");

    if (!mathField) {
        console.error("未找到编辑器元素");
        return;
    }

    console.log("开始初始化应用");

    // 加载保存的公式
    loadFormula((savedFormula) => {
        if (savedFormula) {
            try {
                mathField.setValue(savedFormula, { mode: 'latex' });
                console.log('✓ 已恢复保存的公式:', savedFormula);
                // 触发预览更新
                setTimeout(() => {
                    updatePreview();
                }, 100);
            } catch (e) {
                console.error('恢复公式失败:', e);
            }
        }
    });

    // 导出 LaTeX
    document.getElementById("exportBtn").addEventListener("click", () => {
        try {
            const latex = mathField.getValue('latex');
            console.log("导出 LaTeX:", latex);
            // 复制到剪贴板
            navigator.clipboard.writeText(latex).then(() => {
                alert("LaTeX 已复制到剪贴板: " + latex);
            }).catch(err => {
                console.error("复制失败:", err);
                alert("导出失败: " + err.message);
            });
        } catch (e) {
            console.error("导出失败:", e);
            alert("导出失败: " + e.message);
        }
    });

    // 复制 LaTeX
    document.getElementById("copyBtn").addEventListener("click", () => {
        try {
            const latex = mathField.getValue('latex');
            console.log("复制 LaTeX:", latex);
            navigator.clipboard.writeText(latex).then(() => {
                console.log("✓ 已复制到剪贴板");
            }).catch(err => {
                console.error("复制失败:", err);
                alert("复制失败: " + err.message);
            });
        } catch (e) {
            console.error("获取 LaTeX 失败:", e);
        }
    });

    // 清除公式
    document.getElementById("clearBtn").addEventListener("click", () => {
        try {
            
            mathField.setValue('');
            mathField.focus();

            saveFormula('');
        } catch (e) {
            console.error("清除失败:", e);
            alert("清除失败: " + e.message);
        }
    });

    // 实时预览函数
    const updatePreview = () => {
        try {
            const latex = mathField.getValue('latex');
            console.log("当前 LaTeX:", latex);
            
            if (!latex || latex.trim() === '') {
                preview.innerHTML = '';
                return;
            }
            
            // 使用 MathLive 的内置渲染能力，生成 MathML
            const mathml = mathField.getValue('mathml');
            if (mathml) {
                preview.innerHTML = mathml;
            } else {
                // 备用：显示 LaTeX 代码本身
                preview.textContent = '$' + latex + '$';
            }
            console.log("✓ 预览更新成功");
        } catch(e) {
            console.error("预览更新错误:", e);
            preview.innerHTML = '<span style="color:red;">预览错误: ' + (e.message || e) + '</span>';
        }
    };

    // ...existing code...
    mathField.addEventListener('input', () => {
        updatePreview();
        // 每次编辑时保存公式
        const latex = mathField.getValue('latex');
        saveFormula(latex);
    });
    mathField.addEventListener('update', () => {
        updatePreview();
        const latex = mathField.getValue('latex');
        saveFormula(latex);
    });
    mathField.addEventListener('change', () => {
        updatePreview();
        const latex = mathField.getValue('latex');
        saveFormula(latex);
    });

    // 初始化一次预览
    console.log("初始化预览");
    setTimeout(updatePreview, 200);
}

// 当 DOM 加载完成时，等待库加载
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM 已加载");
    waitForMathLive(initApp);
});