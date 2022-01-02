## 3.1.0

* db/Builder
    - update names of condition operators
* helper/CommonHelper
    - fix relation change parsing

## 3.0.0

* security/rbac
    - multiple rules for one permission
* security/WebUser
    - add default cookie options
* validator/NumberValidator
    - ignore useless leading or trailing zeros
* upgrade dependencies
* upgrade Node.js version

## 2.5.0

* db/ActiveLinker
    - fix backref linking
* behavior/RelationChangeBehavior
    - fix immutability of queries
* validator/FileValidator    
    - optional file path
* validator/Validator    
    - show invalid validator type
    
## 2.4.0

* i18n/Message
    - reorder message arguments
    
## 2.3.0

* base/Controller
    - extract language getter
* db/ActiveRecord
    - fix nested relation name parsing
    - rename method of resolving one relation
* helper/AssignHelper
    - prevent extending of arrays, dates and regex
* helper/StringHelper
    - fix string trimming 
* security/rbac/Item
    - specify not found children 
* web/BodyParser
    - add separate configuration for parsers
* web/packer/Minifier
    - refactor component

## 2.2.0

* base/Controller
    - rename path name to route name
* base/Module
    - rename path name to route name
* helper/StringHelper
    - add snake-case conversions
    - rename capitalize methods
    - rename hyphen naming to kebab
* security/rateLimit
    - rename directory to camel case
    
## 2.1.0

* base/Controller
    - prevent from getting value from parent class
    - use camel case template directory names
* view/Theme
    - clarify template getters
* view/Widget
    - fix cached widget execution

## 2.0.0

* base/Controller
    - clarify request type methods
* base/DataMap
    - filter data map
* base/ExpressEngine
    - add HTTPS server
* log/FileLogStore
    - add buffer output to prevent unsafe multiple saves at once
* use optional chaining
* validator/FilterValidator
    - refactor filter validator
* validator/IntegerValidator
    - add integer validator
* validator/RangeValidator
    - replace range property to values
* validator/StringValidator
    - shrink empties
* validator/Validator
    - instantiate a validator by configuration key
* view/View
    - fix hierarchy of original parents
* web/packer/FilePack
    - add processing of hierarchy of original modules
* web/packer/Minifier
    - exclude quoted strings and regex literals

## 1.6.0

* db/ActiveRecord
    - extract query creation method
* helper/IndexHelper
    - add hierarchical indexing (nested keys)    
    - resolve array of key values    
* security/rbac/Rbac
    - create runtime assignment
* view/ActionView
    - add parent internal template getter
* view/Theme
    - remove name as path if template file is missing
    
## 1.5.0

* base/Application
    - add server port to spawn configuration
* base/Module
    - add configuration name override
    - define default identifiers for components
    - fix hierarchy of originals
* db/MongoDatabase
    - check for table existence before creating
* filter/AccessFilter
    - fix undefined permissions to any permission
* validator/CheckboxValidator
    - fix error message
* web/Router
    - fix inheritance of controllers from originals

## 1.4.0

* base/Controller
    - fix base name
* db/ActiveQuery
    - move related model deletion list to constants
* error/Exception
    - replace HTTP exceptions                 
* scheduler/Task
    - fix task name
    
## 1.3.0

* db/MongoDatabase
    - add command options
    - manage client session
* db/Query
    - add command options
    - fix field selection     
* helper/CommonHelper
    - fix logging with empty prefix 
    
## 1.2.0

* base/Module
    - show errors while requiring file
* helper/EscapeHelper
    - fix escape RegExp    
    - fix escape tags    
* helper/SpawnValidator
    - show file errors   

## 1.1.0

* db/MongoBuilder
    - add EMPTY condition
    - fix column query for indexed result   
* db/MysqlBuilder
    - add EMPTY condition
    - add EXISTS condition
    - fix column query for indexed result   
    
## 1.0.0

* helper/ObjectHelper
    - replace keys in data map
* helper/NestedHelper
    - get whole array element by index
    - rename NestedValueHelper     
* i18n/I18n
    - swap translation arguments
* i18n/MessageSource
    - fix force translation by parent sources     
    
## 0.36.0

* db/MongoBuilder
    - fix not equal condition for arrays
* validator/StringValidator
    - add string trimming by default
    
## 0.35.1

* security/WebUser
    - fix custom return url

## 0.35.0

* base/Configuration
    - fix output configuration name from original module
* base/Controller
    - add web user to spawned objects
* behavior/TrimBehavior
    - remove whitespace from both string ends
* validator/RequireValidator
    - create option to trim empty value

## 0.34.0

* behavior/RelationChangeBehavior
    - unlink and delete by related models only
* db/ActiveRecord
    - fix implicit parameter passing to findById
* db/ActiveQuery
    - skip query with empty link value
* db/MongoDatabase
    - drop all tables
* helper/FileHelper
    - add copy children
    - add flags to copy method
* security/rbac/DatabaseRbacStore
    - parse JSON rule configuration
* validator/CheckboxValidator
    - add True and False value
* validator/RegexValidator
    - fix duration pattern
* validator/SpawnValidator
    - resolve BaseClass from string

## 0.33.0

* validator/ExistValidator
    - add string filter as attribute value filter
    
## 0.32.0

* base/Module
    - inject params from constructor
* db/ActiveRecord
    - fix unlink all via relation
* web/Router
    - add selector of all actions for request methods
    
## 0.31.0

* base/Controller
    - extract render only method
* base/Model
    - move label generation to string helper
    - unset multiple attributes
* base/Module
    - add relative module name
    - exclude app name from logs
    - forward configuration data from module constructor
* helper/ArrayHelper
    - rename diff to exclude
* helper/CommonHelper
    - set not required log prefix
* helper/MathHelper
    - fix Math.round, Math.ceil, Math.floor
* helper/ObjectHelper
    - refactor helpers of delete properties
* view/Theme
    - add view own model methods
* view/LocaleFileMap
    - place language folders on the first locale level
* web/Router
    - redirect to default module

## 0.30.0

* db/MongoDatabase
    - create table when creating index
* helper/ArrayHelper
    - fix hierarchy sorting
* helper/DateHelper
    - add duration parser
* helper/ObjectHelper
    - extract NestedHelper
* i18n/I18n
    - refactor translation
* security/Auth
    - prevent cross-site request forgery
* validator/StringValidator
    - validate by regular expression pattern
* view/ActionView
    - add locale templates including for source language

## 0.29.0

* base/Event
    - add once handler
    - detach all handlers
* db/Query
    - multiple arguments for logical operations
* i18n/MessageSource
    - async message load
* validator/FilterValidator
    - extract CheckboxValidator
    - extract JsonValidator

## 0.28.0

* db/Database
    - database components refactor
* i18n/FileMessageSource
    - file message source refactor
* log/Logger
    - logger refactor
    - extract ActionProfiler as component
* scheduler/Scheduler
    - append initialize method
* security/Auth
    - authentication components refactor

## 0.27.0

* db/ActiveLinker
    - extract as separate entity
* helper/QueryHelper
    - fix query with multiple nested relations
* i18n/I18n
    - resolve message source with module original
* scheduler/Scheduler
    - assign task module
* validator/SpawnValidator
    - validate spawn configuration JSON
* view/Theme
    - add isOrigin flag to template hierarchy
    - get closest ancestor template (to call from overwritten one)

## 0.26.0

* base/Configuration
    - show config file exception
* captcha/CaptchaAction
    - fix font configuration
* helper/FileHelper
    - promised file actions
* log/FileLogStore
    - non-blocking log rotation
* db/QueryBuilder
    - move query builders to base class

## 0.25.0

* base/Base
    - add spawn method to create instance with dependencies
* base/ClassMapper
    - add class dependencies to module configuration
* base/Module
    - add original to inherit all module functionality
* captcha/CaptchaAction
    - replace gm with sharp
* db/ActiveRecord
    - extend beforeSave with beforeInsert and beforeUpdate
    - extend afterSave with afterInsert and afterUpdate
* upgrade to Node.js 12

## 0.24.0

* base/Action
    - add controller's methods
* base/Controller
    - rename getBodyParam to getPostParam
* behavior/OrderBehavior
    - refactor update method
* db/MongoDriver
    - add unset and unsetAll commands
* db/Query
    - append getter methods
* validator/NumberValidator
    - fix validation method

## 0.23.0

* db/Query
    - extend select and addSelect methods to take array and string arguments
* helper/DateHelper
    - extract date methods to a separate class
* helper/MongoHelper
    - add array identifier checker