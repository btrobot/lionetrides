// LionetRides 部署配置
// 声明式 DSL 示例

app "lionetrides" {
  // 应用元数据
  version: "1.0.0"
  description: "LionetRides B2B 官网"
  
  // 技术栈声明
  stack {
    framework: nextjs@14
    runtime: node@24
  }
  
  // 部署配置
  deploy {
    port: 3000
  }
}
