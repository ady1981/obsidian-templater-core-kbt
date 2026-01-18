<%*
////
const input_sequence_specification = {
  Input_sequence_topic: tp.file.title,  
}
const generation_strategy = {
  Granilarity: 'Coarse-grained',
  Expertness: true,  
//  Facts_based_on_reliable_sources: true,
//  '**Use_taxonomy_classification_only**': true,
//  Subclass_as_new_item_forbidden: true,
//  Part_as_new_item_forbidden: true,
//  Superclass_as_new_item_forbidden: true,
//  Universe_of_Discourse_generation: true,
//  Legacy_items_forbidden: true,
//  Hypothetical_items_forbidden: true,
  '**Take_into_account.1**': 'The generation task should only use the provided knowledge source',
  '**Take_into_account.2**': 'The specifications specify aspects maximal broadly', 
  '**Take_into_account.3**': 'These are parts of knowledge_specification: knowledge_source, knowledge_source_credibility, contextualization,  knowledge_retrieval, contextual_priming, knowledge_verification, contextual_boundary, contextual_relevance, contextual_formatting, contextual_authority',
  '**Take_into_account.4**': 'These are parts of generation_specification: knowledge consolidation specification, evaluation metrics, iteration and refinement strategy, examples, safety and ethics specification, post_generation_verification, execution plan specification, knowledge synthesis specification, task decomposition specification, constraint',
  '**Take_into_account.5**': 'These are wrong part of LLM prompt: feedback_loop_specification (because the feedback does not concern the prompt), knowledge_graph_integration_specification (because the knowledge_graph does not concern the prompting), prompt_deployment_specification (because the deployment does not concern the prompting)',
};
const extra_output_specification = {
  Verbosity: 'Low',
//  Verbosity: 'High',
  Output_language: 'English',
  Item_format: 'same as other items',
  Number_of_items: 1
};
const meta = {
    model: 'deepseek/deepseek-chat'
//    model: 'x-ai/grok-4',
//    model: 'moonshotai/kimi-2',
//    model: 'google/gemini-pro-latest'
//    model: 'anthropic/claude-opus-4'
}
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = client.formatItemGeneration;
const calcAIFunction = async () => {    
    const input_sequence = selection;
    const input_sequence_specification2 = client.strProperties(input_sequence_specification);
    const generation_strategy2 = client.strProperties(generation_strategy);    
    const extra_output_specification2 = client.strProperties(extra_output_specification);    
    
    const response = await client.disjoint_sequence_item_generation(tp, input_sequence, input_sequence_specification2, generation_strategy2, extra_output_specification2, meta);
    if (response.status === 200) {
      console.log(client.strJson(response.json))
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
