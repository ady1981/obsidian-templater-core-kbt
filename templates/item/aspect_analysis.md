<%*
////
const analysis_scope = {'Aspects to analyze': 'Primary'};
const analysis_strategy = {'Granularity': 'Fine-grained'};
const extra_output_specification = {'Verbosity': 'Lowest', 'For every value': 'No extra comments'};
////
const client = tp.user.client;
const selection = tp.file.selection() || '';
let updText = selection;
const formatAIResult = client.formatAspectAnalysisResult;
const calcAIFunction = async () => {
    const content = selection;
    const content_topic = tp.file.title;
    const extra_output_specification2 = client.strProperties(extra_output_specification);
    const analysis_scope2 = client.strProperties(analysis_scope);
    const analysis_strategy2 = client.strProperties(analysis_strategy);
    const examples = null;
    const response = await tp.user.client.aspect_based_analysis(tp, content, content_topic, extra_output_specification2, analysis_scope2, analysis_strategy2, examples);
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
