import * as vscode from 'vscode';
import * as esprima from 'esprima';

interface Variable {
  name: string;
  type: string;
  loc: any;
  ref?: string;
  raw?: any;
}

interface Variables {
  [index: string]: Variable;
}

interface RegisteredVariable {
  name: string;
  type: string;
  loc: any;
  callee: string;
  argType?: string;
  ref?: string;
}

interface RegisteredVariables {
  [index: string]: RegisteredVariable;
}

const variables: Variables = {};
const registered: RegisteredVariables = {};

function parseIdentifierVariable(data: any) {
  const type = data.init ? data.init.type : undefined;

  const output = {
    name: data.id.name,
    type,
    loc: data.loc,
    raw: undefined,
    ref: undefined,
  };

  if (
    type === 'CallExpression'
    && data.init
    && data.init.callee
    && data.init.callee.type === 'Identifier'
    && data.init.callee.name === 'require'
  ) {
    output.raw = data.init.arguments;
  } else if (type === 'CallExpression') {
    output.ref = data.init.callee.name;
  } else if (type === 'Literal') {
    output.raw = data.init.raw;
  } else if (type === 'Identifier') {
    output.ref = data.init.name;
  } else {
    // prob not important?
  }

  variables[data.id.name] = { ...output };
}

function parseObjectPatternVariable(data: any) {
  if (data.id.properties) {
    const props = data.id.properties;
    for (let i = 0; i < props.length; i += 1) {
      variables[props[i].key.name] = {
        name: props[i].key.name,
        type: props[i].key.type,
        loc: data.loc,
        ...(props[i].key.type === 'Identifier' && { ref: data.init.name})
      }
    }
  }
}

function parseObjectExpressionArguments(data: any) {
  if (!data.length) {
    return;
  }

  const output = {
    argType: data[0].type,
    ref: undefined,
    raw: undefined,
  };

  if (data[0].type === 'Identifier') {
    output.ref = data[0].name;
  } else if (data[0].type === 'Literal') {
    output.raw = data[0].raw;
  } else {
    // prob not important?
    // console.log(`unknown ObjectExpressionArguments type "${data[0].type}"`);
  }

  return output;
}

function parseObjectExpression(data: any) {
  if (data.properties) {
    const props = data.properties;
    for (let i = 0; i < props.length; i += 1) {
      if (props[i].value.type !== 'CallExpression' && props[i].value.callee.type !== 'Identifier') {
        continue;
      }

      const output = {
        name: props[i].key.name,
        type: props[i].key.type,
        loc: props[i].key.loc,
        callee: props[i].value.callee.name,
        ...(
          props[i].value.arguments &&
          parseObjectExpressionArguments(props[i].value.arguments
        ))
      };

      registered[props[i].key.name] = { ...output };
    }
  }
}

function parseVariableDeclarator(data: any) {
  if (data.id.type === 'Identifier') {
    parseIdentifierVariable(data);
  } else if (data.id.type === 'ObjectPattern') {
    parseObjectPatternVariable(data);
  } else {
    // prob not important?
    // console.log(`unknown VariableDeclarator "${data[i].type}"`);
  }
}

function parseVariableDeclaration(data: any) {
  for (let i = 0; i < data.length; i += 1) {
    if (data[i].type === 'VariableDeclarator') {
      return parseVariableDeclarator(data[i]);
    } else {
      // prob not important?
      // console.log(`unknown VariableDeclaration "${data[i].type}"`);
    }
  }
}

function parseExpressionStatement(data: any) {
  // Only interested in container registrations
  if (data.expression.callee && data.expression.callee.property.name === 'register') {
    const args = data.expression.arguments;
    for (let i = 0; i < args.length; i += 1) {
      if (args[i].type === 'ObjectExpression') {
        parseObjectExpression(args[i]);
      } else {
        // prob not important?
        // console.log(`unknown ExpressionStatement argument type "${args[i].type}"`);
      }
    }
  }
}

function getTheVars(data: any) {
  if (!data.length) {
    console.log('No declarations found');
    return;
  }

  for (let i = 0; i < data.length; i += 1) {
    if (data[i].type === 'VariableDeclaration') {
      parseVariableDeclaration(data[i].declarations);
    } else if (data[i].type === 'ExpressionStatement') {
      parseExpressionStatement(data[i]);
    } else {
      // prob not important?
      // console.log(`unknown Body item type "${data[i].type}"`);
    }
  }
}

const removeUnhandledText = (data: string) => {
  const preparedText = data.replace('...', '');
  return preparedText;
}

const parseContainer = async (container: any) => {
  const containerText = container.getText();
  const preparedText = removeUnhandledText(containerText);

  let parsed;
  try {
    parsed = esprima.parseModule(preparedText, { loc: true });
  } catch (err) {
    console.log('Unable to parse container file', err);
  }
  
  if (parsed && parsed.body) {
    getTheVars(parsed.body);
  }

  return { variables, registered };
}

export default parseContainer;