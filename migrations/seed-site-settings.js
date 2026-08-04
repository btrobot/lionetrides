/**
 * 站点设置初始化脚本
 * 初始化多语言站点配置数据
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PGDATABASE_URL || process.env.DATABASE_URL || 'postgresql://lionet:LionetRides2024!@localhost:5432/lionetrides',
});

const siteSettings = [
  // ==================== 品牌信息 (brand) ====================
  { key: 'company_name', value: 'Lionet Rides', locale: 'en', type: 'text', section: 'brand', label: '公司名称', sortOrder: 1 },
  { key: 'company_name', value: 'Lionet Rides', locale: 'zh', type: 'text', section: 'brand', label: '公司名称', sortOrder: 1 },
  
  { key: 'company_tagline', value: 'Where Thrills Begin', locale: 'en', type: 'text', section: 'brand', label: '公司标语', sortOrder: 2 },
  { key: 'company_tagline', value: '欢乐由此启程', locale: 'zh', type: 'text', section: 'brand', label: '公司标语', sortOrder: 2 },
  
  { key: 'company_description', value: 'Professional amusement ride manufacturer with 25+ years of experience', locale: 'en', type: 'text', section: 'brand', label: '公司简介', sortOrder: 3 },
  { key: 'company_description', value: '专业游乐设施制造商，25 年以上行业经验', locale: 'zh', type: 'text', section: 'brand', label: '公司简介', sortOrder: 3 },

  // ==================== 联系方式 (contact) ====================
  { key: 'contact_person', value: '宋殿栋', locale: 'en', type: 'text', section: 'contact', label: '联系人', sortOrder: 1 },
  { key: 'contact_person', value: '宋殿栋', locale: 'zh', type: 'text', section: 'contact', label: '联系人', sortOrder: 1 },
  
  { key: 'contact_phone', value: '13800138000', locale: 'en', type: 'text', section: 'contact', label: '联系电话', sortOrder: 2 },
  { key: 'contact_phone', value: '13800138000', locale: 'zh', type: 'text', section: 'contact', label: '联系电话', sortOrder: 2 },
  
  { key: 'contact_email', value: 'admin@ridex.com', locale: 'en', type: 'text', section: 'contact', label: '联系邮箱', sortOrder: 3 },
  { key: 'contact_email', value: 'admin@ridex.com', locale: 'zh', type: 'text', section: 'contact', label: '联系邮箱', sortOrder: 3 },
  
  { key: 'contact_address', value: 'No.88 Industrial Avenue, Tianhe District, Guangzhou, China', locale: 'en', type: 'text', section: 'contact', label: '公司地址', sortOrder: 4 },
  { key: 'contact_address', value: '中国广州市天河区工业大道 88 号', locale: 'zh', type: 'text', section: 'contact', label: '公司地址', sortOrder: 4 },
  
  { key: 'contact_working_hours', value: 'Mon-Fri 9:00-18:00', locale: 'en', type: 'text', section: 'contact', label: '工作时间', sortOrder: 5 },
  { key: 'contact_working_hours', value: '周一至周五 9:00-18:00', locale: 'zh', type: 'text', section: 'contact', label: '工作时间', sortOrder: 5 },

  // ==================== 社交媒体 (social) ====================
  { key: 'social_whatsapp', value: '', locale: 'en', type: 'text', section: 'social', label: 'WhatsApp', sortOrder: 1 },
  { key: 'social_whatsapp', value: '', locale: 'zh', type: 'text', section: 'social', label: 'WhatsApp', sortOrder: 1 },
  
  { key: 'social_wechat', value: '', locale: 'en', type: 'text', section: 'social', label: '微信', sortOrder: 2 },
  { key: 'social_wechat', value: '', locale: 'zh', type: 'text', section: 'social', label: '微信', sortOrder: 2 },
  
  { key: 'social_facebook', value: '', locale: 'en', type: 'text', section: 'social', label: 'Facebook', sortOrder: 3 },
  { key: 'social_facebook', value: '', locale: 'zh', type: 'text', section: 'social', label: 'Facebook', sortOrder: 3 },
  
  { key: 'social_youtube', value: '', locale: 'en', type: 'text', section: 'social', label: 'YouTube', sortOrder: 4 },
  { key: 'social_youtube', value: '', locale: 'zh', type: 'text', section: 'social', label: 'YouTube', sortOrder: 4 },

  // ==================== SEO 配置 (seo) ====================
  { key: 'seo_title', value: 'Lionet Rides - Professional Amusement Ride Manufacturer', locale: 'en', type: 'text', section: 'seo', label: 'SEO 标题', sortOrder: 1 },
  { key: 'seo_title', value: 'Lionet Rides - 专业游乐设施制造商', locale: 'zh', type: 'text', section: 'seo', label: 'SEO 标题', sortOrder: 1 },
  
  { key: 'seo_description', value: 'Leading manufacturer of roller coasters, ferris wheels, carousels and amusement park equipment', locale: 'en', type: 'text', section: 'seo', label: 'SEO 描述', sortOrder: 2 },
  { key: 'seo_description', value: '领先的过山车、摩天轮、旋转木马及游乐设备制造商', locale: 'zh', type: 'text', section: 'seo', label: 'SEO 描述', sortOrder: 2 },
  
  { key: 'seo_keywords', value: 'amusement rides, roller coaster, ferris wheel, carousel, theme park equipment', locale: 'en', type: 'text', section: 'seo', label: 'SEO 关键词', sortOrder: 3 },
  { key: 'seo_keywords', value: '游乐设施，过山车，摩天轮，旋转木马，主题公园设备', locale: 'zh', type: 'text', section: 'seo', label: 'SEO 关键词', sortOrder: 3 },

  // ==================== 首页配置 (home) ====================
  { key: 'home_hero_title', value: 'Where Thrills Begin', locale: 'en', type: 'text', section: 'home', label: '首页标题', sortOrder: 1 },
  { key: 'home_hero_title', value: '欢乐由此启程', locale: 'zh', type: 'text', section: 'home', label: '首页标题', sortOrder: 1 },
  
  { key: 'home_hero_subtitle', value: 'Professional amusement ride manufacturer with 25+ years of experience', locale: 'en', type: 'text', section: 'home', label: '首页副标题', sortOrder: 2 },
  { key: 'home_hero_subtitle', value: '25 年专业经验，打造世界级游乐设施', locale: 'zh', type: 'text', section: 'home', label: '首页副标题', sortOrder: 2 },
  
  { key: 'home_stats_projects', value: '500+', locale: 'en', type: 'text', section: 'home', label: '完成项目数', sortOrder: 3 },
  { key: 'home_stats_projects', value: '500+', locale: 'zh', type: 'text', section: 'home', label: '完成项目数', sortOrder: 3 },
  
  { key: 'home_stats_countries', value: '50+', locale: 'en', type: 'text', section: 'home', label: '覆盖国家数', sortOrder: 4 },
  { key: 'home_stats_countries', value: '50+', locale: 'zh', type: 'text', section: 'home', label: '覆盖国家数', sortOrder: 4 },
  
  { key: 'home_stats_experience', value: '25', locale: 'en', type: 'text', section: 'home', label: '行业经验 (年)', sortOrder: 5 },
  { key: 'home_stats_experience', value: '25', locale: 'zh', type: 'text', section: 'home', label: '行业经验 (年)', sortOrder: 5 },

  // ==================== 关于我们 (about) ====================
  { key: 'about_hero_title', value: 'About Lionet Rides', locale: 'en', type: 'text', section: 'about', label: '关于我们标题', sortOrder: 1 },
  { key: 'about_hero_title', value: '关于 Lionet Rides', locale: 'zh', type: 'text', section: 'about', label: '关于我们标题', sortOrder: 1 },
  
  { key: 'about_hero_desc', value: '25+ years of professional experience in amusement ride manufacturing', locale: 'en', type: 'text', section: 'about', label: '关于我们描述', sortOrder: 2 },
  { key: 'about_hero_desc', value: '25 年以上游乐设施制造专业经验', locale: 'zh', type: 'text', section: 'about', label: '关于我们描述', sortOrder: 2 },
  
  { key: 'about_mission_title', value: 'Our Mission', locale: 'en', type: 'text', section: 'about', label: '使命标题', sortOrder: 3 },
  { key: 'about_mission_title', value: '我们的使命', locale: 'zh', type: 'text', section: 'about', label: '使命标题', sortOrder: 3 },
  
  { key: 'about_mission_desc', value: 'To create unforgettable experiences through innovative amusement ride design and manufacturing', locale: 'en', type: 'text', section: 'about', label: '使命描述', sortOrder: 4 },
  { key: 'about_mission_desc', value: '通过创新的游乐设施设计和制造，创造难忘的体验', locale: 'zh', type: 'text', section: 'about', label: '使命描述', sortOrder: 4 },
  
  { key: 'about_vision_title', value: 'Our Vision', locale: 'en', type: 'text', section: 'about', label: '愿景标题', sortOrder: 5 },
  { key: 'about_vision_title', value: '我们的愿景', locale: 'zh', type: 'text', section: 'about', label: '愿景标题', sortOrder: 5 },
  
  { key: 'about_vision_desc', value: 'To be the global leader in amusement ride manufacturing, setting industry standards for safety and innovation', locale: 'en', type: 'text', section: 'about', label: '愿景描述', sortOrder: 6 },
  { key: 'about_vision_desc', value: '成为全球游乐设施制造领导者，树立安全和创新的行业标准', locale: 'zh', type: 'text', section: 'about', label: '愿景描述', sortOrder: 6 },
  
  { key: 'about_team', value: JSON.stringify([
    { name: 'Song Diandong', role: 'CEO', avatar: '', bio: '25+ years in amusement industry' },
    { name: 'Zhang Wei', role: 'CTO', avatar: '', bio: 'Lead engineer with 20 years experience' },
    { name: 'Li Na', role: 'Sales Director', avatar: '', bio: 'International sales expert' }
  ]), locale: 'en', type: 'json', section: 'about', label: '团队信息', sortOrder: 7 },
  
  { key: 'about_team', value: JSON.stringify([
    { name: '宋殿栋', role: 'CEO', avatar: '', bio: '25 年以上游乐行业经验' },
    { name: '张伟', role: 'CTO', avatar: '', bio: '首席工程师，20 年经验' },
    { name: '李娜', role: '销售总监', avatar: '', bio: '国际销售专家' }
  ]), locale: 'zh', type: 'json', section: 'about', label: '团队信息', sortOrder: 7 },
  
  { key: 'about_milestones', value: JSON.stringify([
    { year: '2000', title: 'Company Founded', desc: 'Lionet Rides established in Guangzhou' },
    { year: '2005', title: 'First Export', desc: 'First international project in Southeast Asia' },
    { year: '2010', title: 'ISO Certified', desc: 'ISO 9001 quality management certification' },
    { year: '2015', title: '500+ Projects', desc: 'Completed 500 projects worldwide' },
    { year: '2020', title: 'Global Expansion', desc: 'Expanded to 50+ countries' }
  ]), locale: 'en', type: 'json', section: 'about', label: '发展历程', sortOrder: 8 },
  
  { key: 'about_milestones', value: JSON.stringify([
    { year: '2000', title: '公司成立', desc: 'Lionet Rides 在广州成立' },
    { year: '2005', title: '首次出口', desc: '首个东南亚国际项目' },
    { year: '2010', title: 'ISO 认证', desc: '通过 ISO 9001 质量管理体系认证' },
    { year: '2015', title: '500+ 项目', desc: '完成全球 500 个项目' },
    { year: '2020', title: '全球扩张', desc: '业务扩展至 50+ 国家' }
  ]), locale: 'zh', type: 'json', section: 'about', label: '发展历程', sortOrder: 8 },
];

(async () => {
  try {
    console.log('=== 初始化站点设置 ===');
    
    // 检查是否已有数据
    const { rows } = await pool.query('SELECT count(*) FROM site_settings');
    if (parseInt(rows[0].count) > 0) {
      console.log('site_settings 已有数据，跳过初始化');
      return;
    }
    
    // 插入数据
    for (const setting of siteSettings) {
      await pool.query(
        `INSERT INTO site_settings (key, value, locale, type, section, label, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (key, locale) DO UPDATE SET value = $2, type = $4, section = $5, label = $6, sort_order = $7`,
        [setting.key, setting.value, setting.locale, setting.type, setting.section, setting.label, setting.sortOrder]
      );
    }
    
    console.log(`✓ 已插入 ${siteSettings.length} 条站点设置 (${siteSettings.length / 2} 个配置项 × 2 种语言)`);
    
    // 验证
    const result = await pool.query('SELECT key, locale FROM site_settings GROUP BY key, locale ORDER BY key, locale');
    console.log(`✓ 验证通过：${result.rows.length} 条记录`);
    
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
