<%*
////
const extra_output_specification = {Number_of_examples: 2};
const generation_strategy = {Complexity: 'simple', Diversity_level: 'exhaustive'};
////
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = (result) => result.target_example_texts.join('\n')
const calcAIFunction = async () => {
    const target_example_description = selection;
    const target_example_topic = tp.file.title;
    const extra_output_specification2 = tp.user.client.strProperties(extra_output_specification);
    const generation_strategy2 = tp.user.client.strProperties(generation_strategy);
    const examples = null;
     const response = await tp.user.client.generate_example(tp, target_example_description, target_example_topic, extra_output_specification2, generation_strategy2, examples);
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
