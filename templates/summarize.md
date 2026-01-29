<%*
const topic = tp.file.title;
const client = tp.user.client;
const config = client.config();
const selection = tp.file.selection() || '';
////
const task_specification = {
  Task_type: 'to summarize a given Content'
}
const content = selection;
const target_semantic_specification = {
  Target_type: 'abstractive summary',
  Size: 'concise',
  Tone_and_style: 'neutral and informative',
}
const information_retrieval_strategy = {
//  Knowledge_sources_selection_strategy: 'use only the provided input text',
//  Only_authorative_sources: true,
};
const output_generation_strategy = {  
  Focus_on: 'central theme, main ideas, core arguments',
  Generation_type: 'synthesize and rephrase',
  Synthesis_method: 'paraphrasing and condensation',
  Evaluation_metrics: 'conciseness, fidelity to source'
};
const extra_output_specification = {
  Number_of_items: 1,
//  Output_content_constrains: 'maximum 3 sentences'
};
const meta = {
// model: 'deepseek/deepseek-chat'
 //model: 'x-ai/grok-4',
};
////
let updText = selection;
const formatAIResult = (result) => client.formatAsText(result?.items);
const calcAIFunction = async () => {
     const task_specification2 = client.withSection(client.strProperties(task_specification), 'Content', 2, content, 'md');
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);
     const knowledge_topic = topic;
     const extra_context_knowledge_specification = null;
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     //
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
