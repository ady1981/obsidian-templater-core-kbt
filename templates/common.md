<%*
const topic = tp.file.title;
const selection = tp.file.selection() || '';
const client = tp.user.client;
const config = client.config();
const {differenceItemsSeparator} = config;
////
const knowledge_topic = topic;
const target_semantic_specification = {
  Aspects_to_analyze: 'Primary',
  Analysis_granularity: 'Fine-grained',
};
const information_retrieval_strategy = {
//  Only_authorative_sources: true,
};
const output_generation_strategy = { 
//  Focus_on: '',
};
const extra_output_specification = {
  'Verbosity': 'Low',
};
const meta = {
//  model: 'deepseek/deepseek-chat'
//  model: 'x-ai/grok-4',
};
////
let updText = selection;
const formatAIResult = client.formatCommonResult;
const calcAIFunction = async (items) => {     
     const [leftItem, rightItem] = items;
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);          
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     //
     const response = await client.aspected_commonality_analyze(tp, leftItem, rightItem, knowledge_topic, target_semantic_specification2, information_retrieval_strategy2, output_generation_strategy2, extra_output_specification2, meta);
    if (response.status === 200) {
      console.log('response:\n' + client.strJson(response.json))
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }      
      return formatAIResult(response.json.result, items)
    }
}

if (selection.length > 0) {
  const items = selection.split(differenceItemsSeparator).filter(client.isNotEmpty);
  if (items.length == 2) {
    updText = selection.trim() + '\n' + (await calcAIFunction(items)) + '\n';
  } else {
    new Notice().noticeEl.append(createEl('strong', { text: `Two items separated by '${differenceItemsSeparator.replace('\n', '\\n').trim()}' are required`}));
  }
} else {
    new Notice().noticeEl.append(createEl('strong', { text: 'No selection' }));
}
tp.file.cursor_append(updText)
-%>
