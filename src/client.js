const config = {
    placeholder: '{{}}',
    aiFunctionsBaseURL: 'http://127.0.0.1:5000',
    aiFunctionsAPIToken: 'xxx',
    responseLanguage: 'Russian'
}

function strJson(obj) {
    return JSON.stringify(obj, null, 2)
}    

function strObj(obj) {
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
}

function removeLineWithPlaceholder(text) {
    if (!text) {
        return text;
    }
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.includes(config.placeholder));
    return filteredLines.join('\n');
}

async function abstractive_summarize(tp, content, content_domain, summarizing_strategy, examples) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/abstractive_summarize`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({language: config.responseLanguage, content, content_domain, summarizing_strategy, examples})
    };
    //console.log('request:', strObj(request));
    return await tp.obsidian.requestUrl(request);
}

function maybeWithHeader(value, header) {
    return value ?
       `# ${header}\n${value}\n` :
       ''
}

async function objective_expert_review(tp, content, content_domain, review_strategy, examples) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/objective_expert_review`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            language: config.responseLanguage, 
            content, 
            content_domain, 
            review_strategy, 
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strObj(request));
    return await tp.obsidian.requestUrl(request);
}

async function generate_example(tp, target_example_description, knowledge_domain, extra_output_specification, generation_strategy, examples) {
    const lang_output_specification = strObj({'Content language': config.responseLanguage})
    const extra_output_specification2 = extra_output_specification ?
      lang_output_specification + '\n' + extra_output_specification :
      lang_output_specification;
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/generate_example`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_example_description,
            knowledge_domain,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _generation_strategy: maybeWithHeader(generation_strategy, 'Generation strategy'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

module.exports = {
    config: () => config,
    strJson,
    strObj,
    removeLineWithPlaceholder,
    abstractive_summarize,
    objective_expert_review,
    generate_example
}
