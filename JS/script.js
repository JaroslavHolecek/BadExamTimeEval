/*  Interval is part of Exam, that describe duration (start and end) of part of talk and value assigned to this part. String description of part is possible.
    Based on duration and value, score of interval is calculated.
*/
class Interval {
    constructor(start, end, value, description="") {
        if (!start || !end || !value) {
            throw new Error("Start, end, and value must be provided");
        }
        
        this.start = start;
        this.end = end;

        this.value = parseFloat(value);
        this.description = description;
    }

    /**
     * @param {number | Date} value
     * @throws {Error} if start time is after end time
     */
    set start(value) {
        const newStart = new Date(value);
        if (this.end && newStart >= this.end) {
            throw new Error("Start time must be before end time");
        }
        this._start = newStart;
    }

    get start() {
        return this._start;
    }

    /**
     * @param {number | Date} value
     * @throws {Error} if end time is before start time
     */
    set end(value) {
        const newEnd = new Date(value);
        if (this.start && newEnd <= this.start) {
            throw new Error("End time must be after start time");
        }
        this._end = newEnd;
    }

    get end() {
        return this._end;
    }

    /** Shift the interval (both start and end) by a certain amount of time
     *  @param {number} ms - number of milliseconds to shift the interval
     */
    shift(value) {
        if (typeof value !== "number") {
            throw new Error("Value must be a number");
        }

        if (value === 0) {
            return;
        }

        if (value < 0) {
            this.start = this.start.getTime() + value;
            this.end = this.end.getTime() + value;
        } else {
            this.end = this.end.getTime() + value;
            this.start = this.start.getTime() + value;
        }

    }

    getDuration_ms() {
        return this.end - this.start;
    }

    /**
     *  Score is calculated as the product of the value and the duration of the interval
     */
    getScore_ms() {
        return this.value * this.getDuration_ms();
    }

    toJSON() {
        return {
            start: this.start,
            end: this.end,
            value: this.value,
            description: this.description
        };
    }

    static fromObject(obj) {
        return new Interval(obj.start, obj.end, obj.value, obj.description);
    }

    static fromJSON(json) {
        return Interval.fromObject(JSON.parse(json));
    }
}

class Exam {
    constructor(id, topic, examDate, goalDuration_ms, description="", closed=false) {
        if (!id || !topic || !examDate || !goalDuration_ms) {
            throw new Error("Id, topic, exam date, and goal duration must be provided");
        }

        if (typeof id !== "number") {
            throw new Error("Id must be a number");
        }

        if (typeof topic !== "string") {
            throw new Error("Topic must be a string");
        }

        if (typeof goalDuration_ms !== "number") {
            throw new Error("Goal duration must be a number");
        }

        const dateObj = new Date(examDate);
        if (isNaN(dateObj.getTime())) {
            throw new Error("examDate must be a valid date or date string");
        }

        this.id = id;
        this.topic = topic;
        this.description = description;
        this.examDate = dateObj;
        this.goalDuration_ms = goalDuration_ms;
        this._intervals = [];

        this._closed = closed;        
        this._running = false;
        this._lastTime = undefined;
    }


    /*  
        *****************************
        >>> State query functions <<<
        *****************************    
    */

    /**
     * Resolve whether the exam has been closed
     * @returns {boolean}
     */
    closed() {
        return this._closed;
    }

    /**
     * Resolve whether the exam is running
     * @returns {boolean}
     */
    running() {
        return this._running;
    }

    /**
     * Resolve whether the exam has been started, no matter of actual state of the exam
     * @returns {boolean}
     */
    started() {
        return this.running() || this._intervals.length > 0;
    }

    /**
     * Resolve whether the exam has been started and has not been closed
     * @returns {boolean}
     */
    active() {
        return this.started() && !this.closed();
    }

    /**
     * Resolve whether the exam has been paused
     * @returns {boolean}
     */
    paused() {
        return !this.running() && this.active();
    }

    /*  
        **********************************
        >>> State manipulate functions <<<
        **********************************
    */

    start() {
        if (this.started()) return;

        this._running = true;
        this._lastTime = Date.now();
    }

    close() {
        if (!this.active()) return;

        this._closed = true;
        this._running = false;
        this._lastTime = undefined;

    }

    pause() {
        if (this.paused()) return;

        this._running = false;
        this._lastTime = undefined;
    }

    resume() {
        if (this.running()) return;

        this._running = true;
        this._lastTime = Date.now();
    }

    /*  
        *************************
        >>> Results functions <<<
        *************************
    */

    totalTime_ms(){
        return this._intervals.reduce((acc, interval) => acc + interval.getDuration_ms(), 0);
    }

    totalScore_ms(){
        return this._intervals.reduce((acc, interval) => acc + interval.getScore_ms(), 0);
    }

    recordInterval(value, description="") {
        if (!this.running()) return;

        const currentTime = Date.now();
        if (this._lastTime) {
            this._intervals.push(new Interval(this._lastTime, currentTime, value, description));
        }
        this._lastTime = currentTime;
    }

    getGraphData() {
        return this._intervals.map(interval => ({
            duration: interval.getDuration_ms(),
            value: interval.value
        }));
    }

    toJSON() {
        return {
            id: this.id,
            topic: this.topic,
            description: this.description,
            examDate: this.examDate,
            goalDuration_ms: this.goalDuration_ms,
            closed: this._closed,
            intervals: this._intervals.map(interval => interval.toJSON())
        };
    }

    static fromObject(obj) {
        const exam = new Exam(obj.id, obj.topic, obj.examDate, obj.goalDuration_ms, obj.description, obj.closed);
        exam._intervals = obj.intervals.map(interval => Interval.fromObject(interval));
        return exam;
    }

    static fromJSON(json) {
        return Exam.fromObject(JSON.parse(json));
    }
}

class Student{
    constructor(id, name){        
        this.id = id;
        this.name = name;
    }

    toJSON(){
        return {
            id: this.id,
            name: this.name
        };
    }
    static fromObject(obj){
        return new Student(obj.id, obj.name);
    }
    static fromJSON(json){
        return Student.fromObject(JSON.parse(json));
    }
}

class Group{
    constructor(id, name){
        this.id = id;
        this.name = name;
    }

    toJSON(){
        return {
            id: this.id,
            name: this.name,
        };
    }

    static fromObject(obj){
        const group = new Group(obj.id, obj.name);        
        return group;
    }

    static fromJSON(json){
        return Group.fromObject(JSON.parse(json));
    }
}

/* Wrapper for Exam with addition of assigned student an group */
class AssignedExam{
    constructor(exam, student=undefined, group=undefined){
        this.exam = exam;
        this.student = student;
        this.group = group;
    }

    toJSON(){
        return {
            exam_id: this.exam.id,
            student_id: this.student?.id,
            group_id: this.group?.id
        };
    }

    static fromObject(obj, exams, students, groups){
        const exam = exams.find(exam => exam.id === obj.exam_id);
        
        var student = undefined;
        if (obj.student_id){
            student = students.find(student => student.id === obj.student_id);
        }

        var group = undefined;
        if (obj.group_id){
            group = groups.find(group => group.id === obj.group_id);   
        }   

        return new AssignedExam(exam, student, group);
    }

    static fromJSON(json, exams, students, groups){
        return AssignedExam.fromObject(JSON.parse(json), exams, students, groups);
    }            
}

class Context {
    constructor(name){
        this.name = name;
        this.students = [];
        this.groups = [];
        this.exams = [];
        this.assignedExams = [];

        this._actualAssignedExam = undefined;
        this._actualGroup = undefined;
        this._actualStudent = undefined;

    }

    toJSON(){
        return {
            name: this.name,
            students: this.students.map(student => student.toJSON()),
            groups: this.groups.map(group => group.toJSON()),
            exams: this.exams.map(exam => exam.toJSON()),
            assignedExams: this.assignedExams.map(assignedExam => assignedExam.toJSON())
        };
    }

    static fromObject(obj){
        const context = new Context(obj.name);
        context.students = obj.students.map(student => Student.fromObject(student));
        context.groups = obj.groups.map(group => Group.fromObject(group));
        context.exams = obj.exams.map(exam => Exam.fromObject(exam));
        context.assignedExams = obj.assignedExams.map(assignedExam => AssignedExam.fromObject(assignedExam, context.exams, context.students, context.groups));
        return context;
    }

    static fromJSON(json){
        return Context.fromObject(JSON.parse(json));
    }
}

class App{
    constructor(){
        this.localStorage_prefix = "BadExamTime_";
        this.context = undefined;

    }

    // getGroupsNames_localStorage(){
    //     return Object.keys(localStorage)
    //         .filter(key => key.startsWith(this.localStorage_prefix))
    //         .map(key => key.replace(this.localStorage_prefix, ""));
    // }

    // getGroupsNames_app(){
    //     return this.groups.map(group => group.name);
    // }

    // getGroupsNames(){
    //     return [...new Set(this.getGroupsNames_app().concat(this.getGroupsNames_localStorage()))];
    // }

    // getGroup_name(name){
    //     if (!this.getGroupsNames().includes(name)){
    //         throw new Error(`Group with name >> ${name} << does not exist`);
    //     }
    //     return this.groups.find(group => group.name === name) || this.loadGroup_localStorage(name); 
    // }

    // addGroup_name(name){
    //     if (this.getGroupsNames().includes(name)){
    //         throw new Error(`Choose different name. Group with name >> ${name} << already exists`);
    //     }
    //     let group = new Group(name);
    //     this.groups.push(group);
    //     this.storeGroup_localStorage(group);
    //     return group;
    // }

    // removeGroup_name(name){
    //     if (!this.getGroupsNames().includes(name)){
    //         throw new Error(`Group with name >> ${name} << does not exist`);
    //     }
    //     let grp = this.getGroup_name(name);

    //     this.groups = this.groups.filter(group => group.name !== name);
    //     localStorage.removeItem(this.localStorage_prefix + name);
        
    //     return grp;
    // }

    // removeGroup_actual(){
    //     if (!this.actualGroup){ return; }
    //     let grp = this.removeGroup_name(this.actualGroup.name);
    //     this.actualGroup = undefined;
    //     this.actualExam = undefined;
    //     return grp;
    // }

    // storeGroup_localStorage(group){
    //     localStorage.setItem(this.localStorage_prefix + group.name, JSON.stringify(group));
    // }

    // loadGroup_localStorage(name){
    //     if (!this.getGroupsNames_localStorage().includes(name)){
    //         throw new Error(`Group with name >> ${name} << does not exist`);
    //     }
    //     let prfl = Group.fromJSON(localStorage.getItem(this.localStorage_prefix + name));
    //     this.groups.push(prfl);
    //     return prfl;
    // }

    // storeGroups_all_localStorage(){    
    //     this.groups.forEach(group => this.storeGroup_localStorage(group));
    // }

    // setActualGroup(name){
    //     if (!this.getGroupsNames().includes(name)){
    //         throw new Error(`Group with name >> ${name} << does not exist`);
    //     }
        
    //     this.actualGroup = this.getGroup_name(name);
    //     if (this.actualGroup){
    //         this.setActualExam();
    //     }
    //     return this.actualGroup;
    // }

    // setActualExam(name, examDate){
    //     if (!this.actualGroup){
    //         throw new Error("No group has been set");
    //     }

    //     if(!(name && examDate)){
    //         let exm_nm = this.actualGroup.exams.length;
    //         if (exm_nm === 0){
    //             this.actualExam = undefined;
    //         }else{
    //             this.actualExam = this.actualGroup.exams[exm_nm - 1];
    //         }            
    //         return this.actualExam;
    //     }

    //     this.actualExam = this.actualGroup.exams.find(exam => exam.name === name && exam.examDate === examDate);
    //     return this.actualExam;

    // }    

    // toJSON(){
    //     return {
    //         groups: this.groups.map(group => group.toJSON())
    //     };
    // }

    // static fromObject(obj){
    //     const app = new App();
    //     app.groups = obj.groups.map(group => Group.fromObject(group));
    //     return app;
    // }

    // static fromJSON(json){
    //     return App.fromObject(JSON.parse(json));
    // }
}

class App_UI{
    constructor(app){

        this.app = app;

        this.ui_elements = {};

        this.div_app = document.createElement("div");
        this.div_app.className = "app";

        this.div_main = document.createElement("main");

        /* description */
        this.div_dscr = this.create_description();
        delete this.create_description;
        
        /* administration */
        this.div_admn = this.create_administration();
        delete this.create_administration;

        /* administration > groups */
        let div_admn_grps = this.create_administration_groups();
        this.div_admn.appendChild(div_admn_grps);
        delete this.create_administration_groups;

        /* administration > groups > list */
        this.div_admn_grpsList = this.create_administration_groupsList();
        div_admn_grps.appendChild(this.div_admn_grpsList);
        delete this.create_administration_groupsList;

        /* administration > groups > actual */
        this.div_admn_actualGroup = this.create_administration_actualGroup();
        div_admn_grps.appendChild(this.div_admn_actualGroup);
        delete this.create_administration_actualGroup;

        /* administration > groups > actual > exams */
        let div_exams = this.create_administration_actualGroup_exams();
        this.div_admn_actualGroup.appendChild(div_exams);
        delete this.create_administration_actualGroup_exams;

        /* administration > groups > actual > exams > list */
        this.div_admn_examsList = this.create_administration_actualGroup_examsList();
        div_exams.appendChild(this.div_admn_examsList);
        delete this.create_administration_actualGroup_examsList;

        /* administration > groups > actual > exams > actualExam */
        this.div_admn_actualExam = this.create_administration_actualGroup_actualExam();
        div_exams.appendChild(this.div_admn_actualExam);
        delete this.create_administration_actualGroup_actualExam;

        /* inClass */
        this.div_inClass = this.create_inClass();
        delete this.create_inClass; 
        
        this.sel_inClass_groupSlect = this.create_inClass_groupSelect();
        this.div_inClass.appendChild(this.sel_inClass_groupSlect);
        delete this.create_inClass_groupSelect;

        this.div_inClass_actualGroup = this.create_inClass_actualGroup();
        this.div_inClass.appendChild(this.div_inClass_actualGroup);
        delete this.create_inClass_actualGroup;

        this.div_inClass_actualExam = this.create_inClass_actualExam();
        this.div_inClass_actualGroup.appendChild(this.div_inClass_actualExam);
        delete this.create_inClass_actualExam;

        this.div_inClass.appendChild(this.create_inClass_newExam());
        delete this.create_inClass_newExam;

        this.div_inClass_examsList = this.create_inClass_examsList();
        this.div_inClass_actualGroup.appendChild(this.div_inClass_examsList);
        delete this.create_inClass_examsList;
        //this.addEL_administration_examDelete();

        this.div_app.appendChild(
            this.create_navbar(
                [
                    { name: "Description", section: this.div_dscr, show_function: this.show_description.bind(this) },
                    { name: "Administration", section: this.div_admn, show_function: this.show_administration.bind(this) },
                    { name: "In Class", section: this.div_inClass, show_function: this.show_inClass.bind(this) }
                ]
        ));

        this.div_app.appendChild(this.div_main);
        this.div_main.appendChild(this.div_dscr);
        this.div_main.appendChild(this.div_admn);
        this.div_main.appendChild(this.div_inClass); 
    }

    get_UI(){
        return this.div_app;
    }

    /*
        **************
        >>> navbar <<<
        **************
    */

    create_navbar(navLinks/*[{name:"Text", section:section_to_link}]*/){
        let navBar = document.createElement("nav");

        navLinks.forEach(link => {
            const navButton = document.createElement("button");
            navButton.textContent = link.name;
            navButton.addEventListener("click", () => {
                navLinks.forEach(link => {
                    link.section.style.display = "none";
                });
                link.show_function();
            });
            navBar.appendChild(navButton);
        });
        return navBar;
    }

    show_description(){
        this.div_dscr.style.display = "block";
    }

    show_administration(){
        this.update_administration();
        this.div_admn.style.display = "block";
    }

    show_inClass(){
        this.update_inClass();
        this.div_inClass.style.display = "block";
    }

    /*
        *************************
        >>> sections - create <<<
        *************************
    */

    create_description(){
        let div_description = document.createElement("section");
        div_description.className = "description-section";
        div_description.style.display = "none";

        let h1 = document.createElement("h1");
        h1.textContent = "Description";
        div_description.appendChild(h1);

        let p = document.createElement("p");
        p.textContent = "This is a simple application for tracking the time and value of intervals during an exam.";
        div_description.appendChild(p);

        return div_description;
    }

    create_administration(){
        let div_administration = document.createElement("section");
        div_administration.className = "administration-section";
        div_administration.style.display = "none";

        let h1 = document.createElement("h1");
        h1.textContent = "Administration";
        div_administration.appendChild(h1);

        return div_administration;
    }

    create_administration_groups(){
        let div_groups = document.createElement("div");
        div_groups.className = "groups";

        let h2 = document.createElement("h2");
        h2.textContent = "Groups";
        div_groups.appendChild(h2);

        let button_newGroup = document.createElement("button");
        button_newGroup.className = "btn-show-modal";
        button_newGroup.textContent = "New group";
        button_newGroup.addEventListener("click", () => {
            this.render_modal(this.modalContent_newGroup.bind(this));
        });
        div_groups.appendChild(button_newGroup);

        return div_groups;        
    }

    create_administration_groupsList(){
        let div_groupsList = document.createElement("div");
        div_groupsList.className = "div-list";
        return div_groupsList;
    }

    create_administration_actualGroup(){
        let div_group = document.createElement("div");
        div_group.className = "group";

        let h3 = document.createElement("h3");
        h3.innerHTML = 'Group: <span class="actual-group-name"></span>';
        div_group.appendChild(h3);

        let button_deleteGroup = document.createElement("button");
        button_deleteGroup.textContent = "Delete Group";
        button_deleteGroup.addEventListener("click", () => {
            if (this.app.actualGroup) {
                this.app.removeGroup_actual();
                this.update_administration();
            }
        });
        div_group.appendChild(button_deleteGroup);

        return div_group;
    }

    create_administration_actualGroup_exams(){
        let div_exams = document.createElement("div");
        div_exams.className = "exams";

        let h4 = document.createElement("h4");
        h4.textContent = "Exams";
        div_exams.appendChild(h4);

        return div_exams
    }

    create_administration_actualGroup_examsList(){
        let div_examsList = document.createElement("div");
        div_examsList.className = "div-list";
        return div_examsList;    
    }

    create_administration_actualGroup_actualExam(){
        let div_actualExam = document.createElement("div");
        div_actualExam.className = "actual-exam";

        let h5 = document.createElement("h5");
        h5.textContent = "Actual exam";
        div_actualExam.appendChild(h5);

        div_actualExam.textContent = "Here will be editable exam"

        return div_actualExam
    }


    create_inClass() {
        let div_inClass = document.createElement("section");
        div_inClass.className = "inClass-section";
        div_inClass.style.display = "none";

        let h1 = document.createElement("h1");
        h1.textContent = "In Class";
        div_inClass.appendChild(h1);

        return div_inClass;
    }

    create_inClass_groupSelect(){
        let div_groupSelect = document.createElement("select");
        div_groupSelect.className = "group-select";

        div_groupSelect.addEventListener("change", (event) => {
            const selectedGroupName = event.target.value;
            this.app.setActualGroup(selectedGroupName);
            this.update_inClass_actualGroup();
        });

        return div_groupSelect;
    }

    create_inClass_actualGroup(){
        let div_actualGroup = document.createElement("div");
        div_actualGroup.className = "actual-group";

        let h3 = document.createElement("h3");
        h3.innerHTML = 'Group: <span class="actual-group-name"></span>';
        div_actualGroup.appendChild(h3);

        return div_actualGroup;
    }

    create_inClass_actualExam(){
        let div_actualExam = document.createElement("div");
        div_actualExam.className = "actual-exam";

        let h5 = document.createElement("h5");
        h5.textContent = "Actual exam";
        div_actualExam.appendChild(h5);

        div_actualExam.textContent = "Here will be running exam, control buttons, graph etc."

        return div_actualExam
    }

    create_inClass_newExam(){
        let button_createGroup = document.createElement("button");
        button_createGroup.textContent = "Create new exam";
        button_createGroup.addEventListener("click", () => {
            this.render_modal(this.modalContent_newExam.bind(this));
        });
        return button_createGroup;
    }

    create_inClass_examsList(){
        let div_examsList = document.createElement("div");
        div_examsList.className = "div-list";
        return div_examsList;
    }



    /*
        *************************
        >>> sections - update <<<
        *************************
    */

    update_all(){   
        this.update_description();
        this.update_administration();
        this.update_inClass();
    }

    update_description(){}

    update_administration(){
        this.update_administration_groupsList();
        this.update_administration_actualGroup();
    }

    update_administration_groupsList(){
        this.div_admn_grpsList.innerHTML = "";

        this.app.getGroupsNames().forEach(groupName => {
            let div_group = document.createElement("div");
            div_group.className = "div-list-item";

            let p_groupName = document.createElement("p");
            p_groupName.textContent = groupName;
            div_group.appendChild(p_groupName);
            
            div_group.addEventListener("click", () => {
                this.app.setActualGroup(groupName);
                this.update_administration_actualGroup();
            });
            this.div_admn_grpsList.appendChild(div_group);
        });
    }

    update_administration_actualGroup(){
        const span_name = this.div_admn_actualGroup.querySelector(".actual-group-name");
        const button_delete = this.div_admn_actualGroup.querySelector("button");
        
        if (this.app.actualGroup){
            span_name.textContent = this.app.actualGroup.name;
            button_delete.disabled = false;
        }else{
            span_name.textContent = "> No group selected <";
            button_delete.disabled = true;
        }        
        
        this.update_administration_examsList();
        this.update_administration_actualExam();
    }

    update_administration_examsList(){
        this.div_admn_examsList.innerHTML = "";

        if (!this.app.actualGroup) return;

        let len_for_reverse = this.app.actualGroup.exams.length - 1;
        this.app.actualGroup.exams.slice().reverse().forEach((exam, reversedIndex) => {
            let originalIndex = len_for_reverse - reversedIndex;
            let div_exam = document.createElement("div");
            div_exam.className = "div-list-item";

            let p_exam = document.createElement("p");
            p_exam.textContent = `${exam.name} (${exam.examDate.toLocaleString()} - ${(exam.goalDuration_ms/60000).toFixed(1)}) ${(exam.totalScore_ms()/1000).toFixed(1)}`;
            div_exam.appendChild(p_exam);

            let button_delete = document.createElement("button");
            button_delete.textContent = "Delete";
            button_delete.setAttribute("exam-index", originalIndex);            

            this.div_admn_examsList.appendChild(div_exam);
        });
    }

    update_administration_actualExam(){
        this.div_admn_actualExam.innerHTML = "";
        let h5 = document.createElement("h5");
        h5.textContent = "Actual exam";
        this.div_admn_actualExam.appendChild(h5);

        if (!this.app.actualExam){
            let p_noExam = document.createElement("p");
            p_noExam.textContent = "> No exam selected <";
            this.div_admn_actualExam.appendChild(p_noExam);
            return;
        }

        let div_exam = document.createElement("div");
        div_exam.className = "exam";

        let p_name = document.createElement("p");
        p_name.textContent = "Name: " + this.app.actualExam.name;
        div_exam.appendChild(p_name);

        let p_date = document.createElement("p");
        p_date.textContent = "Date: " + this.app.actualExam.examDate.toLocaleString();
        div_exam.appendChild(p_date);

        let p_duration = document.createElement("p");
        p_duration.textContent = "Duration: " + (this.app.actualExam.goalDuration_ms/60000).toFixed(1) + " minutes";
        div_exam.appendChild(p_duration);

        let p_score = document.createElement("p");
        p_score.textContent = "Score: " + (this.app.actualExam.totalScore_ms()/1000).toFixed(1);
        div_exam.appendChild(p_score);

        this.div_admn_actualExam.appendChild(div_exam);
    }


    update_inClass(){
        this.update_inClass_groupSelect();
        this.update_inClass_actualGroup();
    }  


    update_inClass_groupSelect(){
        this.sel_inClass_groupSlect.innerHTML = "";

        /* fill options */
        let groupNames = this.app.getGroupsNames();
        if(groupNames.length === 0){
            let option_noGroup = document.createElement("option");
            option_noGroup.value = "";
            option_noGroup.textContent = "> No group available <";
            option_noGroup.disabled = true;
            option_noGroup.selected = true;
            this.sel_inClass_groupSlect.appendChild(option_noGroup);
            return;
        }

        groupNames.forEach(groupName => {
            let option_group = document.createElement("option");
            option_group.value = groupName;
            option_group.textContent = groupName;
            this.sel_inClass_groupSlect.appendChild(option_group);
        });

        /* select last used or default*/
        if (this.app.actualGroup){
            this.sel_inClass_groupSlect.value = this.app.actualGroup.name;
            return;
        }

        let group_to_set = groupNames[0]
        this.sel_inClass_groupSlect.value = group_to_set;
        this.app.setActualGroup(group_to_set);        
    }
    
    update_inClass_actualGroup(){
        const span_name = this.div_inClass_actualGroup.querySelector(".actual-group-name");
        
        if (this.app.actualGroup){
            span_name.textContent = this.app.actualGroup.name;
        }else{
            span_name.textContent = "> No group selected <";
        }        

        this.update_inClass_actualExam();
        this.update_inClass_examsList();
    }

    update_inClass_actualExam(){
        this.div_inClass_actualExam.innerHTML = "";
        let h5 = document.createElement("h5");
        h5.textContent = "Actual exam";
        this.div_inClass_actualExam.appendChild(h5);

        if (!this.app.actualExam){
            let p_noExam = document.createElement("p");
            p_noExam.textContent = "> No exam selected <";
            this.div_inClass_actualExam.appendChild(p_noExam);
            return;
        }

        let div_exam = document.createElement("div");
        div_exam.className = "exam";

        let p_name = document.createElement("p");
        p_name.textContent = "Name: " + this.app.actualExam.name;
        div_exam.appendChild(p_name);

        let p_date = document.createElement("p");
        p_date.textContent = "Date: " + this.app.actualExam.examDate.toLocaleString();
        div_exam.appendChild(p_date);

        // let duration_s = this.app.actualExam.goalDuration_ms/1000;
        // let duration_m = duration_s/60;
        // let duration_s_remain = duration_s % 60;

        // let time_s = this.app.actualExam.totalTime_ms()/1000;
        // let time_m = time_s/60;
        // let time_s_remain = time_s % 60;

        // let time_diff_m = time_m - duration_m;
        // let time_diff_s = time_s_remain - duration_s_remain;

        let p_duration = document.createElement("p");
        p_duration.textContent = "Duration: " + (this.app.actualExam.goalDuration_ms/60000).toFixed(1) + " minutes";
        div_exam.appendChild(p_duration);

        let p_score = document.createElement("p");
        p_score.textContent = "Score: " + (this.app.actualExam.totalScore_ms()/1000).toFixed(1);
        div_exam.appendChild(p_score);

        this.div_inClass_actualExam.appendChild(div_exam);
    }

    update_inClass_examsList(){
        const div_list = this.div_inClass_examsList;
        div_list.innerHTML = "";

        if (!this.app.actualGroup) return;

        let exams = this.app.actualGroup.exams;
        if (exams.length === 0){
            let p_noExams = document.createElement("p");
            p_noExams.textContent = "> No exams <";
            div_list.appendChild(p_noExams);
            return;
        }

        let len_for_reverse = this.app.actualGroup.exams.length - 1;
        exams.slice().reverse().forEach((exam, reversedIndex) => {
            let originalIndex = len_for_reverse - reversedIndex;
            let div_exam = document.createElement("div");
            div_exam.className = "div-list-item";

            let p_exam = document.createElement("p");
            p_exam.textContent = `${exam.name} (${exam.examDate.toLocaleString()} - ${(exam.goalDuration_ms/1000).toFixed(1)}) ${(exam.totalScore_ms()/1000).toFixed(1)}`;
            div_exam.appendChild(p_exam);
            div_exam.setAttribute("orig_index", originalIndex);

            div_list.appendChild(div_exam);
        });

        if (!this.app.actualExam){
            this.app.setActualExam(null, null);
        }
    }



    // addEL_administration_examDelete(){
    //     this.admn_actualGroup_examsList.addEventListener("click", (event) => {
    //         if (event.target.tagName === "BUTTON" && event.target.hasAttribute("exam-index")) {
    //             const examIndex = parseInt(event.target.getAttribute("exam-index"));
    //             this.app.actualGroup.exams.splice(examIndex, 1);
    //             this.update_administration_actualGroup_examsList();
    //         }
    //     });
    // }


    /*  
        *************
        >>> modal <<<
        *************
    */
    /**
     * Render a modal with the provided content
     * @param {function} clbck_modalContent - A callback function that returns a div with modal content and takes the modal element (div) as an argument
     */
    render_modal(clbck_modalContent){
        const modal = document.createElement("div");
        modal.className = "modal";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";

        modalContent.appendChild(clbck_modalContent(modal));

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    modalContent_newGroup(modal) {
        let content = document.createElement("div");

        const header = document.createElement("h2");
        header.textContent = "New group";
        content.appendChild(header);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Group name";
        input.required = true;
        content.appendChild(input);

        const buttonCreate = document.createElement("button");
        buttonCreate.textContent = "Create";
        buttonCreate.addEventListener("click", () => {
            this.app.addGroup_name(input.value);
            this.app.setActualGroup(input.value);
            this.update_administration_actualGroup();
            modal.remove();
        });
        content.appendChild(buttonCreate);

        const buttonCancel = document.createElement("button");
        buttonCancel.textContent = "Cancel";
        buttonCancel.addEventListener("click", () => {
            modal.remove();
        });
        content.appendChild(buttonCancel);

        return content;
    }

    modalContent_newExam(modal) {
        let content = document.createElement("div");

        const header = document.createElement("h2");
        header.textContent = "New exam";
        content.appendChild(header);

        const inputName = document.createElement("input");
        inputName.type = "text";
        inputName.placeholder = "Exam name";
        inputName.required = true;
        content.appendChild(inputName);

        const inputDate = document.createElement("input");
        inputDate.type = "datetime-local";
        inputDate.value = new Date().toISOString().slice(0, 16);
        inputDate.required = true;
        content.appendChild(inputDate);

        const inputDuration = document.createElement("input");
        inputDuration.type = "number";
        inputDuration.placeholder = "Duration in seconds";
        inputDuration.required = true;
        content.appendChild(inputDuration);

        const buttonCreate = document.createElement("button");
        buttonCreate.textContent = "Create";
        buttonCreate.addEventListener("click", () => {
            let exm = new Exam(inputName.value, inputDate.value, parseInt(inputDuration.value) * 1000);
            this.app.actualGroup.addExam(exm);
            this.app.setActualExam();
            this.update_inClass_examsList();
            modal.remove();
        });
        content.appendChild(buttonCreate);

        const buttonCancel = document.createElement("button");
        buttonCancel.textContent = "Cancel";
        buttonCancel.addEventListener("click", () => {
            modal.remove();
        });
        content.appendChild(buttonCancel);

        return content;
    }


        









}

// Create an instance of the Exam class and control its behavior

// let currentExam = null;
// let allExams = [];

// const createButton = document.getElementById("create-exam");
// const startButton = document.getElementById("start-exam");
// const pauseButton = document.getElementById("pause-exam");
// const endButton = document.getElementById("end-exam");
// const scoreButtons = document.querySelectorAll(".score-button");
// const examNameInput = document.getElementById("exam-name");
// const examDateTimeInput = document.getElementById("exam-datetime");
// const examDurationInput = document.getElementById("exam-duration");
// const examScoreSpan = document.getElementById("exam-score");
// const examDetailsDiv = document.querySelector(".exam-details");

// const ctx = document.getElementById('score-chart').getContext('2d');
// let chart;

// createButton.addEventListener("click", createExam);
// startButton.addEventListener("click", startExam);
// pauseButton.addEventListener("click", pauseExam);
// endButton.addEventListener("click", endExam);
// scoreButtons.forEach(button => button.addEventListener("click", recordScore));

// function createExam() {
//     if (examNameInput.value && examDateTimeInput.value && examDurationInput.value) {
//         const newExam = new Exam(
//             examNameInput.value,
//             examDateTimeInput.value,
//             parseInt(examDurationInput.value) * 1000
//         );
//         allExams.push(newExam);
//         currentExam = newExam;
//         updateButtons();
//         displayExamDetails(newExam);
//         displayAllExams();
//     }
// }

// function startExam() {
//     if (currentExam) {
//         currentExam.start();
//         updateButtons();
//     }
// }

// function pauseExam() {
//     if (currentExam) {
//         currentExam.pause();
//         updateButtons();
//     }
// }

// function endExam() {
//     if (currentExam) {
//         currentExam.end();
//         updateButtons();
//         //displayScore();
//         displayExamDetails(currentExam)
//         displayAllExams();
//     }
// }

// function recordScore(e) {
//     if (!currentExam || currentExam.examPaused) return;

//     const currentButton = e.target;
//     const scoreValue = parseFloat(currentButton.getAttribute("data-score"));
//     currentExam.recordScore(scoreValue);
//     updateScore();
// }

// function updateButtons() {
//     if (!currentExam || currentExam.examEnded) {
//         createButton.disabled = false;
//         startButton.disabled = true;
//         pauseButton.disabled = true;
//         endButton.disabled = true;
//         return;
//     }

//     if (!currentExam.examStarted) {
//         createButton.disabled = false;
//         startButton.disabled = false;
//         pauseButton.disabled = true;
//         endButton.disabled = true;
//         return;
//     }

//     if (!currentExam.examPaused) {
//         createButton.disabled = true;
//         startButton.disabled = true;
//         pauseButton.disabled = false;
//         endButton.disabled = false;
//         return;
//     }else{
//         createButton.disabled = false;
//         startButton.disabled = true;
//         pauseButton.disabled = false;
//         endButton.disabled = false;
//         return;
//     }
// }

// function updateScore() {
//     if (currentExam) {
//         examScoreSpan.textContent = currentExam.getScore();
//     }
// }

// function displayScore() {
//     if (currentExam) {
//         alert(`Final Score: ${currentExam.getScore()} points`);
//     }
// }

// function drawGraph() {
//     if(currentExam){
//         let cumulativeScore = new Array(currentExam.intervals.length + 1).fill(0);
//         let cumulativeTime = new Array(currentExam.intervals.length + 1).fill(0);
//         for (let i = 0; i < currentExam.intervals.length; i++) {
//             cumulativeScore[i+1] = cumulativeScore[i] + (currentExam.intervals[i] * currentExam.values[i] * 100 / currentExam.totalValueTime);
//             cumulativeTime[i+1] = cumulativeTime[i] + currentExam.intervals[i]/1000;
//         }

        
//         const chartContainer = document.querySelector(".chart-container");
//         chartContainer.innerHTML = '<canvas id="score-chart" width="400" height="200"></canvas>';
//         const canvas = document.getElementById("score-chart");
//         const ctx = canvas.getContext("2d");

        
//         const maxTime = cumulativeTime[cumulativeTime.length - 1];
//         const minScore = Math.min(...cumulativeScore);
//         const maxScore = Math.max(...cumulativeScore);
//         const lastScore = cumulativeScore[cumulativeScore.length - 1];
//         const diffScore = maxScore - minScore;

//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         const padding = 20;
//         const graphWidth = canvas.width - padding * 2;
//         const graphHeight = canvas.height - padding * 2;
//         const graphZeroX = padding;
//         const graphZeroY = canvas.height - padding - ((0 - minScore) / diffScore) * graphHeight;

//         // Draw X axis
//         ctx.beginPath();
//         ctx.moveTo(graphZeroX, graphZeroY);
//         ctx.lineTo(graphZeroX + graphWidth, graphZeroY);
//         ctx.stroke();

//         // Draw Y axis
//         ctx.beginPath();
//         ctx.moveTo(graphZeroX, padding);
//         ctx.lineTo(graphZeroX, graphHeight + padding);
//         ctx.stroke();

//         // Draw max time on X axis
//         ctx.fillText(maxTime.toFixed(0) + "s", graphZeroX + graphWidth - 10, graphZeroY + 15);

//         let startX = graphZeroX;
//         let startY = graphZeroY;
//         // Draw the graph lines
//         for (let i = 1; i < cumulativeTime.length; i++) {
//             const endX = graphZeroX + (cumulativeTime[i] / maxTime) * graphWidth;
//             const endY = graphZeroY - (cumulativeScore[i] / diffScore) * graphHeight;

//             if (cumulativeScore[i] > cumulativeScore[i-1]) {
//             ctx.strokeStyle = "green";
//             } else if (cumulativeScore[i] < cumulativeScore[i-1]) {
//             ctx.strokeStyle = "red";
//             } else {
//             ctx.strokeStyle = "blue";
//             }

//             ctx.beginPath();
//             ctx.moveTo(startX, startY);
//             ctx.lineTo(endX, endY);
//             ctx.stroke();
//             startX = endX;
//             startY = endY;
//         }

//         // Draw min score
//         ctx.fillStyle = "black";
//         const minScoreIndex = cumulativeScore.indexOf(minScore);
//         ctx.fillText(`${minScore.toFixed(1)}`, graphZeroX + (cumulativeTime[minScoreIndex] / maxTime) * graphWidth - 40, graphZeroY - (minScore / diffScore) * graphHeight);

//         // Draw max score
//         const maxScoreIndex = cumulativeScore.indexOf(maxScore);
//         ctx.fillText(`${maxScore.toFixed(1)}`, graphZeroX + (cumulativeTime[maxScoreIndex] / maxTime) * graphWidth - 40, graphZeroY - (maxScore / diffScore) * graphHeight);

//         // Draw final score
//         ctx.fillText(`${lastScore.toFixed(1)}`, startX -40, startY);

        
        
//     }
// }

document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    const appUI = new App_UI(app);
    document.body.appendChild(appUI.get_UI());
    appUI.show_description();
});

// window.addEventListener("beforeunload", () => {
//     localStorage.setItem("BadExam_allExams", JSON.stringify(allExams));
// });

// function displayAllExams() {
//     const examList = document.getElementById("exam-list");
//     examList.innerHTML = "";
//     allExams.forEach((exam, index) => {
//         const listItem = document.createElement("li");
//         listItem.textContent = `${exam.name} ${exam.getScore()} ${exam.datetime} - ${(exam.totalValueTime/1000).toFixed(0)} / ${exam.duration / 1000} seconds`;
//         listItem.addEventListener("click", () => {
//             currentExam = exam;
//             displayExamDetails(exam);
//             updateButtons();
//         });
//         examList.appendChild(listItem);
//     });
// }

// function displayExamDetails(exam) {
//     examDetailsDiv.innerHTML = `
//         <p id="runtime">Runtime: ${(exam.totalTime / 1000).toFixed(0)} seconds</p>
//         <p>Name: ${exam.name}</p>
//         <p>Score: ${exam.getScore()}</p>
//         <p>Date - time: ${exam.datetime}</p>
//         <p>Duration: ${exam.duration / 1000} seconds</p>
//         <button id="draw-graph">Show graph</button>
//         <div class="chart-container"></div>
//     `;

//     document.getElementById("draw-graph").addEventListener("click", drawGraph);
// }
