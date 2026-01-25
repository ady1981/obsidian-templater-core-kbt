const itemsSeparator = '\n';

const config = {
    placeholder: '{{}}',
    itemsSeparator: itemsSeparator,
    differenceSeparator: itemsSeparator,
    aiFunctionsBaseURL: 'http://127.0.0.1:5001',
    aiFunctionsAPIToken: 'xxx',
    responseLanguage: 'Russian',
    emptyValueMark: '-',
    disjointnessScoreThreshold: 0.9,
}

function strJson(obj) {
    return JSON.stringify(obj, null, 2)
}    

function strProperties(obj) {
    if (! obj) { return '' }
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
}

function isNotEmpty(strOrList) {
    return strOrList && strOrList.length > 0;
}

function isEmpty(strOrList) {
    return !strOrList || strOrList.length == 0;
}

function removeLineWithPlaceholder(text) {
    if (!text) {
        return text;
    }
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.includes(config.placeholder));
    return filteredLines.join('\n');
}

function withLanguageOutputSpecification(extra_output_specification) {
    if (extra_output_specification.includes('Output_language:')) {
        return extra_output_specification
    } else {
        const lang_output_specification = strProperties({'Output_language': config.responseLanguage})
        const extra_output_specification2 = isNotEmpty(extra_output_specification) ?
          lang_output_specification + '\n' + extra_output_specification :
          lang_output_specification;
        return extra_output_specification2
    }
}

async function abstractive_summarize(tp, content, content_topic, summarizing_strategy, examples, meta) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/abstractive_summarize`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            language: config.responseLanguage, 
            content, 
            content_topic,
            summarizing_strategy,
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    };
    return await tp.obsidian.requestUrl(request);
}

function maybeWithHeader(value, header) {
    return value ?
       `# ${header}\n${value}\n` :
       ''
}

async function objective_expert_review(tp, content, content_topic, review_strategy, examples, meta) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/objective_expert_review`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            language: config.responseLanguage, 
            content, 
            content_topic, 
            review_strategy, 
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    return await tp.obsidian.requestUrl(request);
}

async function generate_example(tp, target_example_description, target_example_topic, extra_output_specification, generation_strategy, examples, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/generate_example`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_example_description,
            target_example_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _generation_strategy: maybeWithHeader(generation_strategy, 'Generation strategy'),
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function information_retrieval(tp, target_item_description, target_item_topic, extra_output_specification, retrieval_strategy, datasource_specification, examples, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/information_retrieval`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_item_description,
            target_item_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _retrieval_strategy: maybeWithHeader(retrieval_strategy, 'Retrieval strategy'),
            _datasource_specification: maybeWithHeader(datasource_specification, 'Datasource specification'),
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

const isString = (value) => typeof value === "string";

const normalizeText = (text) => isString(text) ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

const sanitizeText = (text) => isString(text) ? normalizeText(text).trim().replace(/\s+/g, '-') : text; 

function getOrDefault(obj, key, defaultValue) {
  return obj[key] ?? defaultValue;
}

function strPrimaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `**${keyStr}**:: ${opts?.normalizeText ? normalizeText(value) : value}`
}

function strSecondaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `${keyStr}:: ${opts?.normalizeText ? normalizeText(value) : value}`
}

function formatAspectAnalysisResult(result, opts = {sanitizeText: true, normalizeText: false}) {
    const properties = result.by_aspects.flatMap(aspect =>
    aspect.features.reduce(({occurs, result}, feature) => {
        occurs[feature.feature_name] = getOrDefault(occurs, feature.feature_name, 0) + 1;
        const idxItem = occurs[feature.feature_name] >= 2 ? occurs[feature.feature_name] : null;
        const updResult = [...result,
            aspect?.is_primary_aspect ?
            strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name, idxItem], feature.feature_elementary_value, opts) :
            strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name, idxItem], feature.feature_elementary_value, opts)];
        return {occurs, result: updResult}
        }, {occurs: {}, result: []})
      .result
    )
    return properties.join('\n');
}

async function aspect_based_analysis(tp, content, content_topic, extra_output_specification, analysis_scope, analysis_strategy, examples, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/aspect_based_analysis`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            content, 
            content_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _analysis_scope: maybeWithHeader(analysis_scope, 'Analysis scope'),
            _analysis_strategy: maybeWithHeader(analysis_strategy, 'Analysis strategy'),
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function constrained_rewriting(tp, content, content_topic, extra_output_specification, transformation_constraints, examples, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/constrained_rewriting`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            content, 
            content_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _transformation_constraints: maybeWithHeader(transformation_constraints, 'Transformation constraints'),
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

function formatDifferenceResult(result, items, opts = {sanitizeText: true, normalizeText: false}) {
  const leftLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value, opts)
    )
  );
  const rightLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value, opts)
    )
  );
  return `# Difference
## ${items[0]}

${leftLines.join('\n')}

## ${items[1]}

${rightLines.join('\n')}
`;
}

async function aspect_based_devergence_analysis(tp, items_topic, left_item, right_item, extra_output_specification, analysis_strategy, examples, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/aspect_based_devergence_analysis`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            items_topic,
            left_item,
            right_item,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _analysis_strategy: maybeWithHeader(analysis_strategy, 'Analysis strategy'),
            _examples: maybeWithHeader(examples, 'Examples'),
            meta
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}


async function disjoint_sequence_item_generation(tp, input_sequence, input_sequence_specification, generation_strategy, extra_output_specification, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/disjoint_sequence_item_generation`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            input_sequence: input_sequence,
            _input_sequence_specification: maybeWithHeader(input_sequence_specification, 'Input sequence specification'),
            _generation_strategy: maybeWithHeader(generation_strategy, 'Generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

function formatItemGeneration({new_disjoint_items}, opts = {normalizeText: false}) {
    const new_disjoint_items2 = isEmpty(new_disjoint_items) ?
      [] :
      new_disjoint_items.filter(c => c.item_disjointness_score && (typeof c.item_disjointness_score === 'number') && c.item_disjointness_score >= config.disjointnessScoreThreshold);
    if (isEmpty(new_disjoint_items2)) {
        //console.log('empty item generation result');
        return config.emptyValueMark;
    }
    return new_disjoint_items2
      .map(c => c?.item_value)
      .map(c => opts?.normalizeText ? normalizeText(c) : c)
      .join('\n')
}

async function term_identification(tp, term_description, intent_content_specification, retrieval_specification, extra_generation_specification, extra_output_specification, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/term_identification`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({      
            term_description, 
            _intent_content_specification: maybeWithHeader(intent_content_specification, 'Intent content specification'),
            _retrieval_specification: maybeWithHeader(retrieval_specification, 'Retrieval specification'),
            _extra_generation_specification: maybeWithHeader(extra_generation_specification, 'Extra generation specification'),
            extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

module.exports = {
    config: () => config,
    strJson,
    strProperties,
    isNotEmpty,
    removeLineWithPlaceholder,
    maybeWithHeader,
    abstractive_summarize,
    objective_expert_review,
    generate_example,
    information_retrieval,
    formatAspectAnalysisResult,
    aspect_based_analysis,
    constrained_rewriting,
    formatDifferenceResult,
    aspect_based_devergence_analysis,
    formatItemGeneration,
    disjoint_sequence_item_generation,
    term_identification
}
