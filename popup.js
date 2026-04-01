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

    // 实时预览函数 - 提前定义
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

    // 标志：是否正在恢复公式
    let isRestoring = false;

    // 加载保存的公式
    loadFormula((savedFormula) => {
        if (savedFormula) {
            try {
                isRestoring = true;
                mathField.setValue(savedFormula, { mode: 'math' });
                console.log('✓ 已恢复保存的公式:', savedFormula);

                // 检查恢复的公式是否为空白内容
                if (!savedFormula || savedFormula.trim() === '') {
                    console.log('检测到恢复的公式为空白，执行清除操作');
                    // 延迟执行清除操作以确保编辑器完全初始化
                    setTimeout(() => {
                        handleClearOperation();
                        isRestoring = false;
                    }, 200);
                } else {
                    // 延迟设置焦点和更新预览，确保 MathField 完全初始化
                    setTimeout(() => {
                        // 确保 mathField 获得焦点和完全初始化
                        mathField.focus();
                        // 再次确保焦点（某些情况下需要两次）
                        setTimeout(() => {
                            mathField.focus();
                        }, 50);
                        updatePreview();
                        isRestoring = false;
                    }, 200);
                }
            } catch (e) {
                console.error('恢复公式失败:', e);
                isRestoring = false;
            }
        } else {
            // 如果没有保存的公式，也执行清除操作以确保初始状态一致
            setTimeout(() => {
                handleClearOperation();
                isRestoring = false;
            }, 200);
        }
    });

    // 清除操作的通用处理函数
    const handleClearOperation = () => {
        try {
            if (!mathField) {
                console.error("mathField 不存在");
                return;
            }

            // 1. 清空
            mathField.setValue('');

            // 2. 保存空状态
            saveFormula('');

            // 3. 延迟恢复焦点和重置状态，确保 MathField 完全初始化
            setTimeout(() => {
                mathField.focus();
                // 触发状态更新（重要：延迟后再触发，确保编辑器状态完全重置）
                mathField.dispatchEvent(new Event('input'));
            }, 100);

            console.log("✓ 已清除公式");

            // 切换回原来的 crab
            switchToCrabNormal();

        } catch (e) {
            console.error("清除失败:", e);
            alert("清除失败: " + e.message);
        }
    };

    // 切换 crab 的函数
    const switchToCrabCopy = () => {
        const crab = document.getElementById('crab');
        const crabCopy = document.getElementById('crabCopy');
        crab.style.display = 'none';
        crabCopy.style.display = 'block';
    };

    const switchToCrabNormal = () => {
        const crab = document.getElementById('crab');
        const crabCopy = document.getElementById('crabCopy');
        crab.style.display = 'block';
        crabCopy.style.display = 'none';
    };

    // 导出 LaTex
    document.getElementById("exportBtn").addEventListener("click", () => {
        try {
            if (!mathField) {
                console.error("mathField 不存在");
                alert("复制失败：编辑器未初始化");
                return;
            }

            mathField.executeCommand(['switchMode', 'math']);

            const latex = mathField.getValue('latex');

            if (!latex || latex.trim() === '') {
                alert("公式为空，无法复制");
                return;
            }

            navigator.clipboard.writeText(latex)
                .then(() => {
                    console.log("✓ LaTeX 已复制到剪贴板:", latex);
                    //alert("LaTeX 已复制到剪贴板");
                    switchToCrabCopy();
                })
                .catch(err => {
                    console.error("复制失败:", err);
                    alert("复制失败: " + err.message);
                });

        } catch (e) {
            console.error("复制失败:", e);
            alert("复制失败: " + e.message);
        }
    });

    // clear
    document.getElementById("clearBtn").addEventListener("click", () => {
        handleClearOperation();
    });


    // ...existing code...

    // 监听输入（自动保存 + 预览）
    mathField.addEventListener('input', () => {
        if (isRestoring) return; // 恢复过程中不保存
        updatePreview();
        saveFormula(mathField.getValue('latex'));
        switchToCrabNormal();
    });

    mathField.addEventListener('update', () => {
        if (isRestoring) return; // 恢复过程中不保存
        updatePreview();
        saveFormula(mathField.getValue('latex'));
        switchToCrabNormal();
    });

    mathField.addEventListener('change', () => {
        if (isRestoring) return; // 恢复过程中不保存
        updatePreview();
        saveFormula(mathField.getValue('latex'));
        switchToCrabNormal();
    });

    // 初始化预览
    setTimeout(updatePreview, 200);

    // 初始化焦点 - 确保编辑器在应用启动时可以输入
    setTimeout(() => {
        if (!mathField.hasFocus) {
            mathField.focus();
        }
    }, 300);

    // Crab following mouse with smooth 60fps animation
    let targetX = 0;
    let currentX = 0;
    const crab = document.getElementById('crab');
    const crabCopy = document.getElementById('crabCopy');

    // Add will-change for better performance
    crab.style.willChange = 'transform';
    crabCopy.style.willChange = 'transform';

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX - window.innerWidth / 2;
        // Clamp to prevent going out of bounds, increased range for more noticeable movement
        targetX = Math.max(-240, Math.min(240, targetX));
    });

    function animateCrab() {
        // Increased damping coefficient for faster, more responsive movement
        currentX += (targetX - currentX) * 0.3;
        crab.style.transform = `translateX(${currentX}px)`;
        crabCopy.style.transform = `translateX(${currentX}px)`;
        requestAnimationFrame(animateCrab);
    }
    animateCrab();
}

// 启动
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM 已加载");
    waitForMathLive(initApp);
});