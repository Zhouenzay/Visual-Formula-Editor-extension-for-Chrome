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
                mathField.setValue(savedFormula, { mode: 'math' });
                console.log('✓ 已恢复保存的公式:', savedFormula);
                setTimeout(updatePreview, 100);
            } catch (e) {
                console.error('恢复公式失败:', e);
            }
        }
    });

    // 导出 LaTeX
    document.getElementById("exportBtn").addEventListener("click", () => {
        try {
            const latex = mathField.getValue('latex');
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

    // ✅ 修复后的 clear（唯一版本）
    document.getElementById("clearBtn").addEventListener("click", () => {
        try {
            if (!mathField) {
                console.error("mathField 不存在");
                return;
            }

            // 1. 清空
            mathField.setValue('');

            // 2. 强制触发状态同步（关键）
            mathField.dispatchEvent(new Event('input'));

            // 3. 保存空状态
            saveFormula('');

            // 4. 恢复焦点（否则你会误判为“不能输入”）
            setTimeout(() => {
                mathField.focus();
            }, 0);

            console.log("✓ 已清除公式");

        } catch (e) {
            console.error("清除失败:", e);
            alert("清除失败: " + e.message);
        }
    });

    // 实时预览函数
    const updatePreview = () => {
        try {
            const latex = mathField.getValue('latex');

            if (!latex || latex.trim() === '') {
                preview.innerHTML = '';
                return;
            }

            const mathml = mathField.getValue('mathml');
            if (mathml) {
                preview.innerHTML = mathml;
            } else {
                preview.textContent = '$' + latex + '$';
            }
        } catch(e) {
            console.error("预览更新错误:", e);
            preview.innerHTML = '<span style="color:red;">预览错误: ' + (e.message || e) + '</span>';
        }
    };

    // 监听输入（自动保存 + 预览）
    mathField.addEventListener('input', () => {
        updatePreview();
        saveFormula(mathField.getValue('latex'));
    });

    mathField.addEventListener('update', () => {
        updatePreview();
        saveFormula(mathField.getValue('latex'));
    });

    mathField.addEventListener('change', () => {
        updatePreview();
        saveFormula(mathField.getValue('latex'));
    });

    // 初始化预览
    setTimeout(updatePreview, 200);
}

// 启动
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM 已加载");
    waitForMathLive(initApp);
});