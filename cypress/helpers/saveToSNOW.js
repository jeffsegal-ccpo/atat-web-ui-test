
const buildTableApiPath = (tableName)=> {
  const baseAPIUrl = Cypress.env("BASE_API_URL");
  return `${baseAPIUrl}/api/now/table/${tableName}`;
  //https://disastorefrontdev.servicenowservices.com/api/now/table/${tableName}
}

export function saveToSNOW(){
  
  const acqPackageEndPoints = [
    {
      'fixture': 'projectOverview',
      'apiURL': 'x_g_dis_atat_project_overview'
    },  
    {
      'fixture': 'organization',
      'apiURL': 'x_g_dis_atat_organization'
    },  
    {
      'fixture': 'contacts',
      'apiURL': 'x_g_dis_atat_contacts'
    }
  ]
  const contractDetailsEndPoints = [
    {
      'fixture': 'fairOpportunity',
      'apiURL': 'x_g_dis_atat_fair_opportunity'
    },
    {
      'fixture': 'period',
      'apiURL': 'x_g_dis_atat_period'
    },
    {
      'fixture': 'periodOfPerformance',
      'apiURL': 'x_g_dis_atat_period_of_performance'
    },
  ]
  const financialDetailsEndPoints = [
    {
      'fixture': 'fairOpportunity',
      'apiURL': 'x_g_dis_atat_fair_opportunity'
    },
  ]

  const otherContractConsiderations =[
    {
      'fixture': 'contractConsiderations',
      'apiURL': 'x_g_dis_atat_contract_considerations'
    },
    {
      'fixture': 'contractConsiderations_GET',
      'apiURL': 'x_g_dis_atat_contract_considerations/**',
      'action': 'GET',
      'statusCode': 200,
      'times': 1
    },
    {
      'fixture': 'contractConsiderations_GET_2',
      'apiURL': 'x_g_dis_atat_contract_considerations/**',
      'action': 'GET',
      'statusCode': 200,
      'times': 1
    },
    {
      'fixture': 'contractConsiderations_PATCH',
      'apiURL': 'x_g_dis_atat_contract_considerations/**',
      'action': 'PATCH',
      'statusCode': 200,
      'times': 1
    },
    {
      'fixture': 'contractConsiderations_PATCH_2',
      'apiURL': 'x_g_dis_atat_contract_considerations/**',
      'action': 'PATCH',
      'statusCode': 200,
      'times': 1,
    },
  ]


  acqPackageEndPoints.concat(
    contractDetailsEndPoints,
    financialDetailsEndPoints,
    otherContractConsiderations
  ).forEach((ep)=>{
    // const action = ep.action || 'POST';
    // cy.fixture("saveToSNOW/" + ep.fixture).then((data) => {
    //   console.log('*** url ****');
    //   console.log(ep.apiUrl);
    //   console.log('*** data *****');
    //   console.log(data)

    let fixtureObj = {
      "fixture": "saveToSNOW/" + ep.fixture,
      "statusCode":  ep.statusCode || 201,
    }

    if (ep.times){
      fixtureObj.times = ep.times;
    }
    // console.log('*** url ****');
    // console.log(ep.apiURL);
    // console.log('***fixture obj*****');
    // console.log(fixtureObj);
    cy.intercept(buildTableApiPath(ep.apiURL), fixtureObj );
  });

}