<%*
////
const analysis_strategy = {
  Aspects_to_analyze: 'Primary',  
  Granularity: 'Fine-grained',
  Ensure_all_feature_values_are_different: true,  
};
const extra_output_specification = {
//  Verbosity: 'Low'
//  Verbosity: 'High'
};
const meta = {
//    model: 'deepseek/deepseek-chat'
//    model: 'x-ai/grok-4',
}
 ////
const client = tp.user.client;
const {differenceSeparator} = client.config();
const selection = tp.file.selection().trim() || '';
let updText = selection;
const formatAIResult = client.formatDifferenceResult;
const calcAIFunction = async (items) => {    
    const items_topic = tp.file.title;
    const [left_item, right_item] = items;
    const extra_output_specification2 = client.strProperties(extra_output_specification);
    const analysis_strategy2 = client.strProperties(analysis_strategy);
    const examples = null;
    const response = await client.aspect_based_devergence_analysis(tp, items_topic, left_item, right_item, extra_output_specification2, analysis_strategy2, examples, meta);
    if (response.status === 200) {
      console.log(client.strJson(response.json))
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }
      return formatAIResult(response.json.result, items)
    }
}

if (selection.length > 0) {
  const items = selection.split(differenceSeparator);
  if (items.length == 2) {
    updText = selection.trim() + '\n' + (await calcAIFunction(items)) + '\n';
  } else {
    new Notice().noticeEl.append(createEl('strong', { text: `No two items separated by '${differenceSeparator.replace('\n', '\\n').trim()}'`}));
  }  
} else {
    new Notice().noticeEl.append(createEl('strong', { text: 'No selection' }));
}
tp.file.cursor_append(updText)
-%>
