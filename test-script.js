// 这是一个JavaScript测试文件
function testFileDetection() {
    console.log("测试文件类型自动检测功能");
    
    const testFiles = [
        "document.txt",
        "image.jpg", 
        "video.mp4",
        "archive.zip"
    ];
    
    testFiles.forEach(file => {
        console.log(`检测文件: ${file}`);
    });
}

testFileDetection();