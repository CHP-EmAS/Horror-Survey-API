import { Request, Response } from "express";

import toObj from "../config/responseStandart"

import { v4 as uuidv4 } from 'uuid';
import { AddSurveyInterface } from "../validation/interfaces";
import { addSurveySchema } from "../validation/surveyValidationSchemas";
import { SurveyModel } from "../models/Survey";
import { SurveyDataModel } from "../models/SurveyData";
import { EmailModel } from "../models/Email";

class SurveyController {

    private static allowSurveyCreation: boolean = true;

    //POST Add Survey
    public static async addSurvey(request: Request, response: Response) {

        if(!SurveyController.allowSurveyCreation) {
            return response.status(403).json(toObj(response));
        }

        const requestParams: AddSurveyInterface = request.body;
    
        const { error } = addSurveySchema.validate(requestParams);
        if(error) {
            console.error("Error: " + error.message) 
            return response.status(400).json(toObj(response,{Error: error.message}));
        }

        var email_already_submitted = false;
        if(requestParams.email && requestParams.email.length > 0) {
            const foundEmail: (EmailModel | null) = await EmailModel.findByPk(requestParams.email);
            if(foundEmail != null) {
                email_already_submitted = true;
            } else {
                let newEmailEntry: any = new EmailModel()
                newEmailEntry.email = requestParams.email;
                newEmailEntry.save();
            }
        }

        
        try{
            console.log("Creating new Survey: " + JSON.stringify(requestParams))

            let survey = new SurveyModel();

            survey.id = uuidv4();
            survey.horror_knowledge = requestParams.horror_knowledge;
            survey.gaming_knowledge = requestParams.gaming_knowledge;
            survey.email_already_submitted = email_already_submitted;

            const addedSurvey: SurveyModel = await survey.save();

            for (const data of requestParams.survey_data) {
                let surveyData = new SurveyDataModel;
                
                surveyData.survey_id = addedSurvey.id;
                surveyData.game_id = data.game_id;
                surveyData.received_order = data.received_order;
                surveyData.scary_scale = data.scary_scale;
                surveyData.tension_scale = data.tension_scale;
                surveyData.assumed_name = data.assumed_name ?? ""
                surveyData.was_assumed = 0;

                await surveyData.save()
            };
        } catch ( error ) {
            console.error(error);
            response.status(500).json(toObj(response));
        }

        try{
            
        } catch ( error ) {
            console.error(error);
        } 

        return response.status(201).json(toObj(response));
    }

    //Toggle Creation
    public static toggleSubmission() {
        SurveyController.allowSurveyCreation = !SurveyController.allowSurveyCreation;
        console.log("Allow Survey Creation: " + SurveyController.allowSurveyCreation);
    }
}

export default SurveyController;
