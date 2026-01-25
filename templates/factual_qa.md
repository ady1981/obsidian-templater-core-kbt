<%*
const topic = tp.file.title;
const selection = tp.file.selection() || '';
////
const question = selection;
const knowledge_topic = topic;
const target_semantic_specification = {
};
const information_retrieval_strategy = {
  Only_authorative_sources: true,
  Prefer_internet_references: true,
};
const output_generation_strategy = {  
//  Focus_on: '',
};
const extra_output_specification = {  
  Result_per_item: true,
  Number_of_items: 3,
  Item_text_format: '{name}',
};
const meta = {
// model: 'deepseek/deepseek-chat'
 //model: 'x-ai/grok-4',
};
////
const client = tp.user.client;
const config = client.config();
let updText = selection;
const formatAIResult = client.formatFactualQA;
const calcAIFunction = async () => {
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     //
     const response = await client.factual_question_answering(tp, question, knowledge_topic, target_semantic_specification2, information_retrieval_strategy2, output_generation_strategy2, extra_output_specification2, meta);
    if (response.status === 200) {
      console.log('response:\n' + client.strJson(response.json))
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
