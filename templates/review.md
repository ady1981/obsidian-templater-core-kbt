<%*
const topic = tp.file.title;
////
const task_specification = {
  Task_description: 'to do objective expert review for a specified content'
}
const target_semantic_specification = {
//  Target_type: 'review',
//  Size: 'concise',
  Tone_and_style: 'neutral and informative',
  Expertness: true
}
const information_retrieval_strategy = {
//  Knowledge_sources_selection_strategy: 'use only the provided input text',
//  Only_authorative_sources: true,
};
const output_generation_strategy = { 
  Focus_on: 'evaluation, analysis of strengths and weaknesses, developing actionable recommendations',
  Item_formatting: 'Markdown',
  Aspects: 'highlight sections'
};
const extra_output_specification = {
//  Number_of_items: 1,
  
};
const meta = {
  model: 'deepseek/deepseek-chat'
 //model: 'x-ai/grok-4',
};
////
const client = tp.user.client;
const config = client.config();
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => client.isEmpty(result?.items) ? config.emptyValueMark : result.items.map(c => c.item).join('\n');
const calcAIFunction = async () => {
     const task_specification2 = client.strProperties(task_specification);
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);
     const knowledge_topic = topic;
     const input_content = client.encodeInMarkdown(selection, 'md');
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     //
     const response = await client.contextual_generate(tp, task_specification2, target_semantic_specification2, knowledge_topic, input_content, information_retrieval_strategy2, output_generation_strategy2, extra_output_specification2, meta);
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
