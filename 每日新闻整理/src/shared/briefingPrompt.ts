export function buildBriefingPrompt(date: string): string {
  return `请生成今日国际新闻双语 Markdown 简报。

时间与范围：
- 简报日期：${date}
- 以该日期 Asia/Hong_Kong 时间为准，优先整理过去 24 小时内的最新国际新闻。
- 必须主动检索最新信息，不要依赖旧知识。
- 主要参考 Bloomberg、CNBC、The Wall Street Journal、Financial Times；如遇付费墙或无法访问全文，允许用 Reuters、AP、官方公告、公司新闻稿、央行/政府官网、监管机构官网等公开来源补足。
- 每条新闻都要附来源链接；如多个来源互相印证，可列 1-2 个关键来源。

输出格式：
- 仅输出 Markdown。
- 使用中文为主，英文并列。
- 每条新闻必须包含：中文标题、English title、中文摘要 2-4 句、English summary 2-4 sentences、来源链接。
- 摘要要包含新闻内容和关键事实，不要只提取标题或一句核心观点。
- 内容要简洁但准确，避免夸张和无来源判断。
- 如某条信息仍在发展中，请明确写“仍在发展中 / developing”。

固定结构：
# 每日国际新闻双语简报 - ${date}

## 1. 金融相关信息 / Finance and Markets
整理 10 条。偏向全球主要市场：美国、日本、新加坡、欧盟、中国、香港。覆盖宏观经济、央行/利率、财政与监管政策、汇率、股市、债市、大宗商品、银行与金融机构、跨境资本流动等。

## 2. 主要市场指数走势 / Major Market Index Performance
统计美股、中国股市、其他主要市场的指数走势情况。

必须覆盖：
- U.S. equities: Dow Jones Industrial Average, S&P 500, Nasdaq Composite
- Chinese equities: Shanghai Composite, Shenzhen Component 或 CSI 300, Hang Seng Index, Hang Seng Tech Index
- Other major markets: Nikkei 225, TOPIX, STOXX Europe 600 或 Euro Stoxx 50, FTSE 100, Singapore STI，以及当天重要的其他区域指数

每个指数包含：最新点位、日涨跌幅、简短中文解读、brief English note、数据来源链接。如果市场休市，标注“最近收盘 / latest close”。

## 3. AI 相关新闻 / AI News
整理 5 条。关注 AI 前沿报道、模型/芯片/云基础设施、监管、投融资、企业产品发布、产业落地和安全治理。

## 4. 热点信息与大公司事件 / Major Companies and Global Hot Topics
整理 5 条。选择全球最热门、影响面较大的公司或热点事件，优先覆盖大型科技、能源、汽车、消费、制药、航运、并购、监管调查等。

## 5. 国际政治新闻 / International Politics
整理 5 条。覆盖全球重要政治、外交、安全、选举、制裁、贸易摩擦、地缘冲突等。

## 今日重点观察 / Key Watch
用 3-5 条 bullet 总结当天最值得继续关注的线索。

质量要求：
- 金融部分必须尽量平衡覆盖美国、日本、新加坡、欧盟、中国、香港；如果某一地区当天没有足够重要新闻，可以用其他全球市场新闻补足，并在摘要中体现原因。
- 不要编造无法核实的细节。对数据、日期、金额、涨跌幅、政策名称、机构名称要核对来源。
- 不要输出过程性说明；如果某来源不可用，直接使用公开可靠来源补足。`;
}
