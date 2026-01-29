<%*
const topic = tp.file.title;
const selection = tp.file.selection() || '';
const client = tp.user.client;
const config = client.config();
////
const task_specification = {
  Task_description: 'to generate relevant examples based on a given "Target example description"'  
}
const target_example_description = selection;
const target_semantic_specification = {
}
const information_retrieval_strategy = {
//  Only_authorative_sources: true,
};
const output_generation_strategy = { 
//  Focus_on: '',
};
const extra_output_specification = {
//  Number_of_items: 1,
  Item_formatting: 'Markdown',
};
const meta = {
//  model: 'deepseek/deepseek-chat'
//  model: 'x-ai/grok-4',
};
////
let updText = selection;
const formatAIResult = (result) => client.isEmpty(result?.items) ? config.emptyValueMark : client.formatAsList(result.items);
const calcAIFunction = async () => {
     const task_specification2 = client.withSection(client.strProperties(task_specification), 'Target example description', 2, target_example_description, 'md');
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);
     const knowledge_topic = topic;
     const extra_context_knowledge_specification = null;
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     const response = await client.generate(tp, task_specification2, target_semantic_specification2, knowledge_topic, extra_context_knowledge_specification, information_retrieval_strategy2, output_generation_strategy2, extra_output_specification2, meta);
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
