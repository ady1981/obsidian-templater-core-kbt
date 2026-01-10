<%*
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => result.target_example_texts.join('\n')
const calcAIFunction = async () => {
    const target_example_description = selection;
    const knowledge_domain = tp.file.title;
    const extra_output_specification = tp.user.client.strObj({Number_of_examples: 2});
    const generation_strategy = tp.user.client.strObj({Complexity: 'simple', Diversity_level: 'exhaustive'});
    const examples = null;
     const response = await tp.user.client.generate_example(tp, target_example_description, knowledge_domain, extra_output_specification, generation_strategy, examples);
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
