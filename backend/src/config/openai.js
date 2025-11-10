const { Configuration, OpenAIApi } = require('openai');
const config = require('../../../config/globalConfig');

// 初始化OpenAI配置
const configuration = new Configuration({
  apiKey: config.openai.apiKey
});

const openai = new OpenAIApi(configuration);

// 导出默认配置的OpenAI实例和配置
module.exports = {
  client: openai,
  config: config.openai
};