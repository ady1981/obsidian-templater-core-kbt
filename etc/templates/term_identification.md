<%*
////
const extra_generation_specification = {  
  'Expertness': true,
  'Common_shorthand': true,
};
const extra_output_specification = {};
const meta = {};
const term_description_topic = tp.file.title;
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => result.term;
const calcAIFunction = async () => {    
     const term_description = selection;
     const intent_content_specification = term_description_topic ? client.strProperties({Term_description_topic: term_description_topic}) : null;
     const retrieval_specification = null;
     const extra_generation_specification2 = client.strProperties(extra_generation_specification);
     const extra_output_specification2 = client.strProperties(extra_output_specification);
     const response = await client.term_identification(tp, term_description, intent_content_specification, retrieval_specification, extra_generation_specification2, extra_output_specification2, meta);
    if (response.status === 200) {
      //console.log(`result: ${tp.user.client.strJson(response.json)}`)
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
