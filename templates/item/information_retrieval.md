<%*
////
const datasource_specification = {
  Internet_sources: true, 
  Reputative_sources: true
};
const retrieval_strategy = {
  Experness: true
}
const extra_output_specification = {
//  Number_of_items: 1
};
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => {
  const {texts, refs} = result.target_information
    .reduce((acc, {text, references}) => ({texts: [...acc.texts, text], refs: [...acc.refs, ...references]}), {texts: [], refs: []});
  const refsStr = '[Refs::\n' 
          + refs.map(c => `  - ${c?.reference_text}${c?.reference_type === 'internal_knowledge' ? ' // internal knowledge' : ''}`)
            .join('\n');
  return texts.join('\n') + '\n' + refsStr  
};
const calcAIFunction = async () => {
    const target_item_description = selection;
    const target_item_topic = tp.file.title;
    const extra_output_specification2 = client.strProperties(extra_output_specification);
    const retrieval_strategy2 = client.strProperties(retrieval_strategy);
    const datasource_specification2 = client.strProperties(datasource_specification);
    const examples = null;
    const response = await tp.user.client.information_retrieval(tp, target_item_description, target_item_topic, extra_output_specification2, retrieval_strategy2, datasource_specification2, examples);
    if (response.status === 200) {
      //console.log(tp.user.client.strJson(response.json))
      if (response.json.result?.other_notes) {
        console.log(`other_notes: ${response.json.result.other_notes}`)
      }      
      return formatAIResult(response.json.result)
    }
}

if (selection.length > 0) {
  updText = selection.trim() + '\n' + (await calcAIFunction()) + '\n';
} else {    
    new Notice().noticeEl.append(createEl("strong", { text: "No selection" }));
}
tp.file.cursor_append(updText)
-%>
