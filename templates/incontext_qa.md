<%*
const topic = tp.file.title;
const selection = tp.file.selection() || '';
const client = tp.user.client;
const config = client.config();
const active_file_content = await app.vault.read(app.workspace.getActiveFile());
////
const question = client.encodeInMarkdown(selection);
const source_knowledge_specification = {
  Source_document_title: topic
}
const source_knowledge_content = client.removeSuffix(active_file_content, selection);
const target_semantic_specification = {
};
const information_retrieval_strategy = {
};
const output_generation_strategy = {  
//  Focus_on: '',
};
const extra_output_specification = {  
  Result_per_item: true,
//  Number_of_items: 1,
//  Item_text_format: '{name}',
//  Item_formatting: 'Markdown',
};
const meta = {
//  model: 'deepseek/deepseek-chat'
//  model: 'x-ai/grok-4',
};
////
let updText = selection;
const formatAIResult = client.formatIncontextQAResult;
const calcAIFunction = async () => {
     const source_knowledge_specification2 = client.withContentSection(client.strProperties(source_knowledge_specification), 'Source knowledge content', 2, source_knowledge_content, 'md');
     const target_semantic_specification2 = client.strProperties(target_semantic_specification);
     const information_retrieval_strategy2 = client.strProperties(information_retrieval_strategy);
     const output_generation_strategy2 = client.strProperties(output_generation_strategy);
     const extra_output_specification2 = client.strProperties(extra_output_specification);     
     //
     const response = await client.incontext_question_answering(tp, question, source_knowledge_specification2, target_semantic_specification2, information_retrieval_strategy2, output_generation_strategy2, extra_output_specification2, meta);
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
