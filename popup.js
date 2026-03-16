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

// 初始化应用
function initApp() {
    const mathField = document.getElementById("mathField");
    const latexOutput = document.getElementById("latexOutput");
    const preview = document.getElementById("preview");

    if (!mathField) {
        console.error("未找到编辑器元素");
        return;
    }

    console.log("开始初始化应用");

    // 导出 LaTeX
    document.getElementById("exportBtn").addEventListener("click", () => {
        try {
            const latex = mathField.getValue('latex');
            console.log("导出 LaTeX:", latex);
            latexOutput.value = latex;
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

    // 监听编辑器事件
    mathField.addEventListener('input', updatePreview);
    mathField.addEventListener('update', updatePreview);
    mathField.addEventListener('change', updatePreview);

    // 初始化一次预览
    console.log("初始化预览");
    setTimeout(updatePreview, 200);
}

// 当 DOM 加载完成时，等待库加载
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM 已加载");
    waitForMathLive(initApp);
});