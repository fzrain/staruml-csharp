/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const fs = require('fs')
const path = require('path')
const codegen = require('./codegen-utils')

/**
 * C# Code Generator
 */
class CSharpCodeGenerator {
  /**
   * @constructor
   *
   * @param {type.UMLPackage} baseModel
   * @param {string} basePath generated files and directories to be placed
   */
  constructor(baseModel, basePath) {
    /** @member {type.Model} */
    this.baseModel = baseModel

    /** @member {string} */
    this.basePath = basePath
  }

  /**
   * Return Indent String based on options
   * @param {Object} options
   * @return {string}
   */
  getIndentString(options) {
    if (options.useTab) {
      return '\t'
    } else {
      var i, len
      var indent = []
      for (i = 0, len = options.indentSpaces; i < len; i++) {
        indent.push(' ')
      }
      return indent.join('')
    }
  }

  /**
   * Generate codes from a given element
   * @param {type.Model} elem
   * @param {string} path
   * @param {Object} options
   * @return {$.Promise}
   */
  generate(elem, basePath, options) {
    var fullPath, codeWriter
    var isAnnotationType = elem.stereotype === 'annotationType'
    fullPath = basePath + '/' + elem.name + '.cs'
    codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: ' + elem.name + ".cs")
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using System;')
    codeWriter.writeLine('using System.Collections.Generic;')
    
    // Package
    if (elem instanceof type.UMLPackage) {
      fullPath = path.join(basePath, elem.name)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath)
      }   
      if (Array.isArray(elem.ownedElements)) {
        elem.ownedElements.forEach(child => {
          return this.generate(child, fullPath, options)
        })
      }
    } else if (elem instanceof type.UMLClass) {
      if (!fs.existsSync(basePath + '/Domains')) {
        fs.mkdirSync(basePath + '/Domains')
      }
      if (!fs.existsSync(basePath + '/AppServices')) {
        fs.mkdirSync(basePath + '/AppServices')
      }
      if (!fs.existsSync(basePath + '/Controllers')) {
        fs.mkdirSync(basePath + '/Controllers')
      }
      if (!fs.existsSync(basePath + '/Dtos')) {
        fs.mkdirSync(basePath + '/Dtos')
      }
      if (!fs.existsSync(basePath + '/Infrastructure')) {
        fs.mkdirSync(basePath + '/Infrastructure')
      }
      // AnnotationType
      if (isAnnotationType) {
        if (elem.name.length < 9) {
          elem.name = elem.name + 'Attribute'
        } else if (elem.name.substring(elem.name.length - 9, elem.name.length) !== 'Attribute') {
          elem.name = elem.name + 'Attribute'
        }

        codeWriter.writeLine()
        this.writeNamespace('writeAnnotationType', codeWriter, elem, options, isAnnotationType)
        fs.writeFileSync(fullPath, codeWriter.getData())
      } else {
        // Class
        codeWriter.writeLine('using Siia.Core.Util.Domains;')
        codeWriter.writeLine('using '+ elem._parent.name +'.Domains.Enums;')
        codeWriter.writeLine()
        this.writeNamespace('writeClass', codeWriter, elem, options, isAnnotationType)
        if (!fs.existsSync(basePath + '/Domains/Entities')) {
          fs.mkdirSync(basePath + '/Domains/Entities')
        }
        fs.writeFileSync(basePath + '/Domains/Entities/'+ elem.name + '.cs', codeWriter.getData())
        this.writeControllers(elem,basePath,options)
        this.writeAppServices(elem,basePath,options)
        this.writeEfConfigs(elem,basePath,options)
        this.writeDtos(elem,basePath,options)
      }
    } else if (elem instanceof type.UMLInterface) {
      // Interface  
      codeWriter.writeLine()
      this.writeNamespace('writeInterface', codeWriter, elem, options, isAnnotationType)
      if (!fs.existsSync(basePath + '/Domains/Interfaces')) {
        fs.mkdirSync(basePath + '/Domains/Interfaces')
      }
      fs.writeFileSync(basePath + '/Domains/Interfaces/'+ elem.name + '.cs', codeWriter.getData())
    } else if (elem instanceof type.UMLEnumeration) {
      // Enum
      codeWriter.writeLine()
      this.writeNamespace('writeEnum', codeWriter, elem, options, isAnnotationType)
      if (!fs.existsSync(basePath + '/Domains/Enums')) {
        fs.mkdirSync(basePath + '/Domains/Enums')
      }
      fs.writeFileSync(basePath + '/Domains/Enums/'+ elem.name + '.cs', codeWriter.getData())
    }
  }
  //生成Controllers代码
  writeControllers(elem,basePath,options){
    var codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: ' + elem.name + "Controller.cs")
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using '+ elem._parent.name +'.AppServices.'+elem.name+'Service;')
    codeWriter.writeLine('using '+ elem._parent.name +'.Dtos.'+elem.name+'Dtos;')
    codeWriter.writeLine('using Siia.Core.Util.Datas.Queries;')
    codeWriter.writeLine('using Siia.Core.Webs.Controllers;')
    codeWriter.writeLine()
    codeWriter.writeLine('namespace ' + elem._parent.name + '.Controllers')
    codeWriter.writeLine('{')
    codeWriter.indent()
    this.writeDoc(codeWriter, elem.documentation+'Controller', options)
    codeWriter.writeLine('public class ' + elem.name + 'Controller:CrudControllerBase<'+elem.name+'ResponseDto,'+elem.name+'CreationRequestDto,'+elem.name+'ModificationRequestDto,QueryParameter>')
    codeWriter.writeLine('{')
    codeWriter.indent()
    codeWriter.writeLine('private readonly I'+elem.name+'AppService '+elem.name.substring(0,1).toLowerCase()+elem.name.substring(1)+'Serivce;')
    codeWriter.writeLine('public '+elem.name+'Controller(I'+elem.name+'AppService service) : base(service)')
    codeWriter.writeLine('{')
    codeWriter.indent()
    codeWriter.writeLine(elem.name.substring(0,1).toLowerCase()+elem.name.substring(1)+'Serivce = service;')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    fs.writeFileSync(basePath + '/Controllers/'+ elem.name + 'Controller.cs', codeWriter.getData())
  }
  //生成Dtos代码
  writeDtos(elem,basePath,options){
    var filedir=basePath + '/Dtos/'+elem.name+'Dtos'
    if (!fs.existsSync(filedir)) {
      fs.mkdirSync(filedir)
    }
    this.writeInnerDtos(elem,filedir+'/'+ elem.name + 'CreationRequestDto.cs','CreationRequest',options)
    this.writeInnerDtos(elem,filedir+'/'+ elem.name + 'ModificationRequestDto.cs','ModificationRequest',options)
    this.writeInnerDtos(elem,filedir+'/'+ elem.name + 'ResponseDto.cs','Response',options)
  }
  writeInnerDtos(elem,fileName,baseType,options){
    var codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: ' + elem.name +baseType+ 'Dto.cs')
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using System;')
    codeWriter.writeLine('using System.Collections.Generic;')
    codeWriter.writeLine('using Siia.Core.Util.Applications.Dtos;')
    codeWriter.writeLine('using '+ elem._parent.name +'.Domains.Enums;')

    codeWriter.writeLine()
    codeWriter.writeLine('namespace ' + elem._parent.name + '.Dtos.'+elem.name+'Dtos')
    codeWriter.writeLine('{')
    codeWriter.indent()
    this.writeDoc(codeWriter, elem.documentation+'新增DTO', options)
    codeWriter.writeLine('public partial class ' + elem.name + baseType+'Dto:'+baseType+'Base')
    codeWriter.writeLine('{')
    codeWriter.indent()
    var i, len
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options)
      codeWriter.writeLine()
    }
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    fs.writeFileSync(fileName, codeWriter.getData())
  }
  //生成AppServices代码
  writeAppServices(elem,basePath,options){
    var filedir=basePath + '/AppServices/'+elem.name+'Service'
    if (!fs.existsSync(filedir)) {
      fs.mkdirSync(filedir)
    }
    var codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: ' + elem.name + "AppService.cs")
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using ' + elem._parent.name + '.Domains.Entities;')
    codeWriter.writeLine('using ' + elem._parent.name + '.Dtos.'+elem.name+'Dtos;')
    codeWriter.writeLine('using Siia.Core.Applications;')
    codeWriter.writeLine('using Siia.Core.Util.Datas.Queries;')
    codeWriter.writeLine('using Siia.Core.Util.Datas.UnitOfWorks;')
    codeWriter.writeLine('using Siia.Core.Util.Domains.Repositories;')
    codeWriter.writeLine()
    codeWriter.writeLine('namespace ' + elem._parent.name + '.AppServices.'+elem.name+'Service')
    codeWriter.writeLine('{')
    codeWriter.indent()
    this.writeDoc(codeWriter, elem.documentation+'应用服务实现', options)
    codeWriter.writeLine('public class ' + elem.name + 'AppService:CrudServiceBase<'+elem.name+','+elem.name+'ResponseDto,'+elem.name+'CreationRequestDto,'+elem.name+'ModificationRequestDto,QueryParameter>,I'+elem.name+'AppService')
    codeWriter.writeLine('{')
    codeWriter.indent()
    codeWriter.writeLine('public '+elem.name+'AppService(IUnitOfWork unitOfWork, IRepository<'+elem.name+'> repository) : base(unitOfWork, repository)')
    codeWriter.writeLine('{')
    codeWriter.writeLine()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    fs.writeFileSync(filedir+'/'+ elem.name + 'AppService.cs', codeWriter.getData())

    codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: I' + elem.name + 'AppService.cs')
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using ' + elem._parent.name + '.Dtos.' + elem.name + 'Dtos;')
    codeWriter.writeLine('using Siia.Core.Applications;')
    codeWriter.writeLine('using Siia.Core.Util.Datas.Queries;')
    codeWriter.writeLine()
    codeWriter.writeLine('namespace ' + elem._parent.name + '.AppServices.'+elem.name+'Service')
    codeWriter.writeLine('{')
    codeWriter.indent()
    this.writeDoc(codeWriter, elem.documentation+'应用服务接口', options)
    codeWriter.writeLine('public interface I' + elem.name + 'AppService: ICrudService<' + elem.name + 'ResponseDto, ' + elem.name + 'CreationRequestDto, ' + elem.name + 'ModificationRequestDto, QueryParameter>')
    codeWriter.writeLine('{')
   
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    fs.writeFileSync(filedir+'/I'+ elem.name + 'AppService.cs', codeWriter.getData())

  }
  //生成EfConfig代码
  writeEfConfigs(elem,basePath,options){
    var filedir=basePath + '/Infrastructure/EntityConfigurations'
    if (!fs.existsSync(filedir)) {
      fs.mkdirSync(filedir)
    }
    var codeWriter = new codegen.CodeWriter(this.getIndentString(options))
    codeWriter.writeLine('//----------------------------------------------------------------')
    codeWriter.writeLine('// Copyright (C) ' + new Date().getFullYear() + ' 上海驰亚信息技术有限公司')
    codeWriter.writeLine('// 版权所有。')
    codeWriter.writeLine('// All rights reserved.')
    codeWriter.writeLine('//')
    codeWriter.writeLine('// 文件名: ' + elem.name + 'Map.cs')
    codeWriter.writeLine('// 文件功能描述:')
    codeWriter.writeLine('// 创建标识：云辉殿 ' + new Date().toLocaleString())
    codeWriter.writeLine('//-----------------------------------------------------------------')
    codeWriter.writeLine('using ' + elem._parent.name + '.Domains.Entities;')
    codeWriter.writeLine('using Microsoft.EntityFrameworkCore;')
    codeWriter.writeLine('using Microsoft.EntityFrameworkCore.Metadata.Builders;')
    codeWriter.writeLine('using Siia.Core.Repository.EntityFrameworkCore.MySql;')
    codeWriter.writeLine()
    codeWriter.writeLine('namespace ' + elem._parent.name + '.Infrastructure.EntityConfigurations')
    codeWriter.writeLine('{')
    codeWriter.indent()
    this.writeDoc(codeWriter, elem.documentation+'数据库映射', options)
    codeWriter.writeLine('public class ' + elem.name + 'Map: AggregateRootMap<' + elem.name + '>')
    codeWriter.writeLine('{')
    codeWriter.indent()
    codeWriter.writeLine('protected override void MapTable(EntityTypeBuilder<'+elem.name+'> builder)')
    codeWriter.writeLine('{')
    codeWriter.indent()
    codeWriter.writeLine('builder.ToTable("'+elem.name+'s");')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    codeWriter.outdent()
    codeWriter.writeLine('}')
    fs.writeFileSync(filedir+'/'+ elem.name + 'Map.cs', codeWriter.getData())
  }
  /**
   * Write Namespace
   * @param {functionName} writeFunction
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeNamespace(writeFunction, codeWriter, elem, options) {
    var path = null
    if (elem._parent) {
      //path = elem._parent.getPath(this.baseModel).map(function (e) { return e.name }).join('.')
      path = elem._parent.name
    }
    if (writeFunction === 'writeAnnotationType') {
      codeWriter.writeLine('namespace ' + path + '.Domains.Annotation')
      codeWriter.writeLine('{')
      codeWriter.indent()
      this.writeAnnotationType(codeWriter, elem, options)
    } else if (writeFunction === 'writeClass') {
      codeWriter.writeLine('namespace ' + path + '.Domains.Entities')
      codeWriter.writeLine('{')
      codeWriter.indent()
      this.writeClass(codeWriter, elem, options)
    } else if (writeFunction === 'writeInterface') {
      codeWriter.writeLine('namespace ' + path + '.Domains.Interfaces')
      codeWriter.writeLine('{')
      codeWriter.indent()
      this.writeInterface(codeWriter, elem, options)
    } else if (writeFunction === 'writeEnum') {
      codeWriter.writeLine('namespace ' + path + '.Domains.Enums')
      codeWriter.writeLine('{')
      codeWriter.indent()
      this.writeEnum(codeWriter, elem, options)
    }
    if (path) {
      codeWriter.outdent()
      codeWriter.writeLine('}')
    }
  }

  /**
   * Write Enum
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeEnum(codeWriter, elem, options) {
    var i, len
    var terms = []
    // Doc
    this.writeDoc(codeWriter, elem.documentation, options)

    // Modifiers
    var visibility = this.getVisibility(elem)
    if (visibility) {
      terms.push(visibility)
    }
    // Enum
    terms.push('enum')
    terms.push(elem.name)

    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.indent()

    // Literals
    for (i = 0, len = elem.literals.length; i < len; i++) {
      codeWriter.writeLine(elem.literals[i].name + (i < elem.literals.length - 1 ? ',' : ''))
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write Interface
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeInterface(codeWriter, elem, options) {
    var i, len
    var terms = []

    // Doc
    this.writeDoc(codeWriter, elem.documentation, options)

    // Modifiers
    var visibility = this.getVisibility(elem)
    if (visibility) {
      terms.push(visibility)
    }

    // Interface
    terms.push('interface')
    terms.push(elem.name)

    // Extends
    var _extends = this.getSuperClasses(elem)
    if (_extends.length > 0) {
      terms.push(': ' + _extends.map(function (e) { return e.name }).join(', '))
    }
    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.writeLine()
    codeWriter.indent()

    // Member Variables
    // (from attributes)
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options)
      codeWriter.writeLine()
    }
    // (from associations)
    var associations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLAssociation)
    })
    for (i = 0, len = associations.length; i < len; i++) {
      var asso = associations[i]
      if (asso.end1.reference === elem && asso.end2.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end2, options)
        codeWriter.writeLine()
      } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end1, options)
        codeWriter.writeLine()
      }
    }

    // Methods
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], options, true, false)
      codeWriter.writeLine()
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options)
        } else {
          this.writeClass(codeWriter, def, options)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options)
        codeWriter.writeLine()
      }
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write AnnotationType
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeAnnotationType(codeWriter, elem, options) {
    var i, len
    var terms = []
    // Doc
    var doc = elem.documentation.trim()
    if (app.project.getProject().author && app.project.getProject().author.length > 0) {
      //doc += '\n@author ' + app.project.getProject().author
    }
    this.writeDoc(codeWriter, doc, options)

    // Modifiers
    var _modifiers = this.getModifiers(elem)
    if (elem.operations.some(function (op) { return op.isAbstract === true })) {
      _modifiers.push('abstract')
    }
    if (_modifiers.length > 0) {
      terms.push(_modifiers.join(' '))
    }

    // Class
    terms.push('class')
    terms.push(elem.name)

    // AnnotationType => Attribute in C#
    terms.push(':System.Attribute')
    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.writeLine()
    codeWriter.indent()

    // Constructor
    this.writeConstructor(codeWriter, elem, options)
    codeWriter.writeLine()

    // Member Variables
    // (from attributes)
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options)
      codeWriter.writeLine()
    }
    // (from associations)
    var associations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLAssociation)
    })

    for (i = 0, len = associations.length; i < len; i++) {
      var asso = associations[i]
      if (asso.end1.reference === elem && asso.end2.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end2, options)
        codeWriter.writeLine()
      } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end1, options)
        codeWriter.writeLine()
      }
    }

    // Methods
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], options, false, false)
      codeWriter.writeLine()
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options)
        } else {
          this.writeClass(codeWriter, def, options)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options)
        codeWriter.writeLine()
      }
    }
    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write Class
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeClass(codeWriter, elem, options) {
    var i, len
    var terms = []

    // Doc
    var doc = elem.documentation.trim()

    this.writeDoc(codeWriter, doc, options)

    // Modifiers
    var _modifiers = this.getModifiers(elem)
    if (elem.operations.some(function (op) { return op.isAbstract === true }) && !_modifiers.includes('abstract')) {
      _modifiers.push('abstract')
    }
    if (_modifiers.length > 0) {
      terms.push(_modifiers.join(' '))
    }

    // 默认都是分部类
    terms.push('partial')
    terms.push('class')
    terms.push(elem.name)

    // 继承
    var _extends = this.getSuperClasses(elem)
    if (_extends.length > 0) {
      terms.push(': ' + _extends[0].name)
    } else if (elem.stereotype === 'EntityBase') {
      terms.push(': EntityBase')
    } else {
      terms.push(': AggregateRoot')
    }

    // 实现接口
    var _implements = this.getSuperInterfaces(elem)
    if (_implements.length > 0) {
      terms.push(', ' + _implements.map(function (e) { return e.name }).join(', '))
    }

    codeWriter.writeLine(terms.join(' '))
    codeWriter.writeLine('{')
    codeWriter.writeLine()
    codeWriter.indent()

    // 生成构造函数
    // this.writeConstructor(codeWriter, elem, options)
    // codeWriter.writeLine()

    // C#属性
    // (普通属性)
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options)
      codeWriter.writeLine()
    }
    // (导航属性)
    var associations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLAssociation)
    })

    for (i = 0, len = associations.length; i < len; i++) {
      var asso = associations[i]
      if (asso.end1.reference === elem && asso.end2.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end2, options)
        codeWriter.writeLine()
      } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end1, options)
        codeWriter.writeLine()
      }
    }

    // 方法
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], options, false, false)
      codeWriter.writeLine()
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options)
        } else {
          this.writeClass(codeWriter, def, options)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options)
        codeWriter.writeLine()
      }
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write Method
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {boolean} skipBody
   * @param {boolean} skipParams
   */
  writeMethod(codeWriter, elem, options, skipBody, skipParams) {
    if (elem.name.length > 0) {
      var terms = []
      var params = elem.getNonReturnParameters()
      var returnParam = elem.getReturnParameter()

      // doc
      var doc = elem.documentation.trim()
      this.writeDoc(codeWriter, doc, options)
      params.forEach(function (param) {
        codeWriter.writeLine('/// <param name="' + param.name + '">' + param.documentation + '</param>')
      })
      if (returnParam) {
        codeWriter.writeLine('/// <returns>' + returnParam.documentation + '</returns>')
      }


      // modifiers
      var _modifiers = this.getModifiers(elem)
      if (_modifiers.length > 0) {
        terms.push(_modifiers.join(' '))
      }

      // type
      if (returnParam) {
        terms.push(this.getType(returnParam))
      } else {
        terms.push('void')
      }

      // name + parameters
      var paramTerms = []
      if (!skipParams) {
        var i, len
        for (i = 0, len = params.length; i < len; i++) {
          var p = params[i]
          var s = this.getType(p) + ' ' + p.name
          if (p.isReadOnly === true) {
            s = 'sealed ' + s
          }
          paramTerms.push(s)
        }
      }
      terms.push(elem.name + '(' + paramTerms.join(', ') + ')')

      // body
      if (skipBody === true || _modifiers.includes('abstract')) {
        codeWriter.writeLine(terms.join(' ') + ';')
      } else {
        codeWriter.writeLine(terms.join(' '))
        codeWriter.writeLine('{')
        codeWriter.indent()
        codeWriter.writeLine('// todo:实现你自己的逻辑')

        // return statement
        if (returnParam) {
          var returnType = this.getType(returnParam)
          if (returnType === 'bool') {
            codeWriter.writeLine('return False;')
          } else if (returnType === 'byte' || returnType === 'int' || returnType === 'sbyte' || returnType === 'short' || returnType === 'uint' || returnType === 'ulong' || returnType === 'ushort') {
            codeWriter.writeLine('return 0;')
          } else if (returnType === 'float') {
            codeWriter.writeLine('return 0.0F;')
          } else if (returnType === 'double') {
            codeWriter.writeLine('return 0.0D;')
          } else if (returnType === 'long') {
            codeWriter.writeLine('return 0.0L;')
          } else if (returnType === 'decimal') {
            codeWriter.writeLine('return 0.0M;')
          } else if (returnType === 'char') {
            codeWriter.writeLine('return "\\0";')
          } else if (returnType === 'string') {
            codeWriter.writeLine('return "";')
          } else {
            codeWriter.writeLine('return null;')
          }
        }

        codeWriter.outdent()
        codeWriter.writeLine('}')
      }
    }
  };

  /**
   * 获取类型
   * @param {type.Model} elem
   * @return {string}
   */
  getType(elem) {
    var _type = 'void'
    // type name
    if (elem instanceof type.UMLAssociationEnd) {
      if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
        _type = elem.reference.name
      }
    } else {
      if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
        _type = elem.type.name
      } else if ((typeof elem.type === 'string') && elem.type.length > 0) {
        _type = elem.type
      }
    }

    // 一对多配置
    if (elem.multiplicity) {
      if (['0..*', '1..*', '*'].includes(elem.multiplicity.trim())) {
        if (elem.isOrdered === true) {//集合类型
          _type = 'virtual IList<' + _type + '>'
        } else {
          _type = 'virtual ICollection<' + _type + '>'
        }
      } else if (['0..1', '1'].includes(elem.multiplicity.trim())) { // 实体类型
        _type = 'virtual ' + _type
      }
    }
    return _type
  }

  /**
   * Write Member Variable
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeMemberVariable(codeWriter, elem, options) {
    var propertyName = elem.name;
    if (elem instanceof type.UMLAssociationEnd) {
      if (elem.reference instanceof type.UMLModelElement) {
        propertyName = elem.reference.name
      }
      if (elem.multiplicity && ['0..*', '1..*', '*'].includes(elem.multiplicity.trim())) {
        propertyName = elem.reference.name + "s"
      }
      else if (elem.multiplicity.trim() == '0..1') {
        this.writeDoc(codeWriter, propertyName + "实体关联外键Id", options)
        codeWriter.writeLine('public int? ' + propertyName + 'Id { get; set; }')
      } else if (elem.multiplicity.trim() == '1') {
        this.writeDoc(codeWriter, propertyName + "实体关联外键Id", options)
        codeWriter.writeLine('public int ' + propertyName + 'Id { get; set; }')
      }
    }

    if (propertyName.length > 0) {
      var terms = []
      // doc
      this.writeDoc(codeWriter, elem.documentation, options)
      // modifiers
      var _modifiers = this.getModifiers(elem)
      if (_modifiers.length > 0) {
        terms.push(_modifiers.join(' '))
      }
      // type
      terms.push(this.getType(elem))
      // name
      terms.push(propertyName)


      // 自动属性 getter setter
      terms.push('{')
      if (elem.isReadOnly) {
        terms.push('get;')
      } else {
        terms.push('get; set;')
      }
      terms.push('}')
      // property
      //if (elem.stereotype === 'property') {

      // } else {
      //   terms.push(';')   
      // }
      // initial value
      if (elem.defaultValue && elem.defaultValue.length > 0) {
        terms.push(' = ' + elem.defaultValue + ';')
      }
      codeWriter.writeLine(terms.join(' '))
    }
  }

  /**
   * Write Constructor
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeConstructor(codeWriter, elem, options) {
    if (elem.name.length > 0) {
      var terms = []
      // Doc
      this.writeDoc(codeWriter, elem.documentation, options)
      // Visibility
      var visibility = this.getVisibility(elem)
      if (visibility) {
        terms.push(visibility)
      }
      terms.push(elem.name + '()')
      codeWriter.writeLine(terms.join(' '))
      codeWriter.writeLine('{')
      codeWriter.writeLine('}')
    }
  }

  /**
   * Write Doc
   * @param {StringWriter} codeWriter
   * @param {string} text
   * @param {Object} options
   */
  writeDoc(codeWriter, text, options) {
    var i, len, lines
    if (options.csharpDoc && (typeof text === 'string') && text.trim().length > 0) {
      lines = text.trim().split('\n')
      codeWriter.writeLine('/// <summary>')
      for (i = 0, len = lines.length; i < len; i++) {
        codeWriter.writeLine('/// ' + lines[i])
      }
      codeWriter.writeLine('/// </summary>')
    }
  }

  /**
   * Return visibility
   * @param {type.Model} elem
   * @return {string}
   */
  getVisibility(elem) {
    switch (elem.visibility) {
      case type.UMLModelElement.VK_PUBLIC:
        return 'public'
      case type.UMLModelElement.VK_PROTECTED:
        return 'protected'
      case type.UMLModelElement.VK_PRIVATE:
        return 'private'
      case type.UMLModelElement.VK_PACKAGE:
        return 'internal'
    }
    return null
  }

  /**
   * Collect modifiers of a given element.
   * @param {type.Model} elem
   * @return {Array.<string>}
   */
  getModifiers(elem) {
    var modifiers = []
    var visibility = this.getVisibility(elem)
    if (visibility) {
      modifiers.push(visibility)
    }
    if (elem.isStatic === true) {
      modifiers.push('static')
    }
    if (elem.isAbstract === true) {
      modifiers.push('abstract')
    }
    if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
      modifiers.push('sealed')
    }
    // if (elem.concurrency === UML.CCK_CONCURRENT) {
    // http://msdn.microsoft.com/ko-kr/library/c5kehkcz.aspx
    // modifiers.push("synchronized");
    // }
    // transient
    // volatile
    // strictfp
    // const
    // native
    return modifiers
  }

  /**
   * Collect super classes of a given element
   * @param {type.Model} elem
   * @return {Array.<type.Model>}
   */
  getSuperClasses(elem) {
    var generalizations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLGeneralization && rel.source === elem)
    })
    return generalizations.map(function (gen) { return gen.target })
  };

  /**
   * Collect super interfaces of a given element
   * @param {type.Model} elem
   * @return {Array.<type.Model>}
   */
  getSuperInterfaces(elem) {
    var realizations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLInterfaceRealization && rel.source === elem)
    })
    return realizations.map(function (gen) { return gen.target })
  }

}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate(baseModel, basePath, options) {
  var csharpCodeGenerator = new CSharpCodeGenerator(baseModel, basePath)
  csharpCodeGenerator.generate(baseModel, basePath, options)
}

exports.generate = generate
