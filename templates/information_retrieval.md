<%*
////
const extra_output_specification = {Number_of_items: 1};
const retrieval_strategy = {Strictly_retrieve_elementary_item: true}
////
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => result.target_information
  .map(({text, references}) => text
    + (tp.user.client.isNotEmpty(references) ? 
        '\n[Refs::\n' 
          + references.map(c => `  - ${c?.reference_text}${c?.reference_type === 'internal_knowledge' ? ' // internal knowledge' : ''}`)
          .join('\n')
          + ']\n':
        ''))
  .join('\n');
const calcAIFunction = async () => {
    const target_item_description = selection;
    const target_item_topic = tp.file.title;
    const extra_output_specification2 = tp.user.client.strProperties(extra_output_specification);
    const retrieval_strategy2 = tp.user.client.strProperties(retrieval_strategy);
    const examples = null;
    const response = await tp.user.client.information_retrieval(tp, target_item_description, target_item_topic, extra_output_specification2, retrieval_strategy2, examples);
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
