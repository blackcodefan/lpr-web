import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { isCpf } from "validator-brazil";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Col,
    Row,
    Form,
    FormFeedback,
    FormGroup,
    Input,
    CustomInput,
    Label
} from 'reactstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.min.css';
import {toast} from 'react-toastify';
import Services from '../../Services';

Yup.addMethod(Yup.string, 'cpf', function() {
    return this.test({
        name: 'name',
        message: 'Cpf inválido',
        test: (cpf = '') => {
            return isCpf(cpf)
        }
    })
});

const validationSchema = function (values) {
    return Yup.object().shape({
        name: Yup.string()
            .min(6, `O nome deve ter pelo menos 6 caracteres`)
            .required('Nome é obrigatório'),
        cpf: Yup.string()
            .cpf('Cpf inválido')
            .required('CPF é obrigatório'),
        organization: Yup.string()
            .required('organização é necessária')
            .min(5, 'A organização deve ter pelo menos 5 caracteres'),
        city: Yup.string()
            .required('Cidade é necessária'),
        group: Yup.string()
            .required('Grupo é obrigatório'),
        email: Yup.string()
            .required('Email é obrigatório')
            .email('Email inválido'),
        whatsApp: Yup.string()
            .required('Whatsapp é necessário')
            .matches(/(?:1[2-9]|[2-9]\d) [5-9]\d{8}$/, 'Número de Whatsapp inválido'),
        mobile: Yup.string()
            .required('Celular é necessário')
            .matches(/(?:1[2-9]|[2-9]\d) [5-9]\d{8}$/, 'Número de celular inválido'),
        role: Yup.string()
            .required('Função é necessário'),
    })
};

const validate = (getValidationSchema) => {
    return (values) => {
        const validationSchema = getValidationSchema(values);
        try {
            validationSchema.validateSync(values, { abortEarly: false });
            return {}
        } catch (error) {
            return getErrorsFromValidationError(error)
        }
    }
};

const getErrorsFromValidationError = (validationError) => {
    const FIRST_ERROR = 0;
    return validationError.inner.reduce((errors, error) => {
        return {
            ...errors,
            [error.path]: error.errors[FIRST_ERROR],
        }
    }, {})
};

const mobileFormatter = mobile =>{
   let removedPrefix = mobile.substring(3);
   return removedPrefix.substring(0, 2) + ' ' + removedPrefix.substring(2);
};

let initialValues = null;

const  Profile = props => {
    const {id} = useParams();

    const [cities, setCities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [permission, setPermission] = useState([]);
    const [profile, setProfile] = useState(null);

    useEffect(() =>{
        Services.CityService.fetchAll()
            .then(res =>{
                if(res.success){
                    setCities(res.cities);
                }else{
                    toast.warn(res.errorMsg);
                }
            });
        Services.GroupService.fetchAll()
            .then(res =>{
                if(res.success){
                    setGroups(res.groups);
                }else{
                    toast.warn(res.errorMsg);
                }
            });
        Services.PermissionService.fetchAll()
            .then(res =>{
                if(res.success){
                    let pers = [];
                    for (let permission of res.permissions) {
                        pers.push({
                            value: permission._id,
                            label: permission.name
                        })
                    }
                    setPermissions(pers);
                }else{
                    toast.warn(res.errorMsg);
                }
            });
        Services.AuthService.profile(id)
            .then(res =>{
                if (res.success){
                    initialValues = {...res.profile};
                    initialValues.password = '';
                    initialValues.mobile = mobileFormatter(initialValues.mobile);
                    initialValues.whatsApp = mobileFormatter(initialValues.whatsApp);
                    let pers = [];
                    for (let permission of initialValues.permissions) {
                        pers.push({
                            value: permission._id,
                            label: permission.name
                        })
                    }
                    initialValues.success = true;
                    setPermission(pers);
                    setProfile(initialValues);
                }else{
                    setProfile({success: false});
                    toast.warn(res.errorMsg);
                }
            });
    }, []);

    const onSubmit = async (values, { setSubmitting, setErrors })  =>{
        let params = {...values};
        params.permissions = permission.map(a => a.value);
        params.whatsApp = "+55" + params.whatsApp.replace(/\s/g, '');
        params.mobile = "+55" + params.mobile.replace(/\s/g, '');

        Services.AuthService.update(id, params)
            .then(res =>{
                if(res.success){
                    toast.success("Criado com sucesso!");
                }else {
                    toast.warn(res.errorMsg);
                }
                setSubmitting(false);
            });
    };

    const loading = () => <div className="animated fadeIn pt-1 text-center"><div className="sk-spinner sk-spinner-pulse"/></div>;

    const load = () =>{
        if(profile && profile.success)
            return <Formik
                initialValues={profile}
                validate={validate(validationSchema)}
                onSubmit={onSubmit}
                render={
                    ({
                         values,
                         errors,
                         touched,
                         status,
                         dirty,
                         handleChange,
                         handleBlur,
                         handleSubmit,
                         isSubmitting,
                         isValid,
                     }) => (
                        <Row>
                            <Col>
                                <Form onSubmit={handleSubmit} noValidate>
                                    <FormGroup>
                                        <Input type="text"
                                               name="name"
                                               id="name"
                                               placeholder="Nome"
                                               autoComplete="name"
                                               valid={!errors.name}
                                               invalid={touched.name && !!errors.name}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.name}/>
                                        <FormFeedback>{errors.name}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="text"
                                               name="cpf"
                                               id="cpf"
                                               placeholder="CPF"
                                               autoComplete="cpf"
                                               valid={!errors.cpf}
                                               invalid={touched.cpf && !!errors.cpf}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.cpf}/>
                                        <FormFeedback>{errors.cpf}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="text"
                                               name="email"
                                               id="email"
                                               placeholder="Email"
                                               autoComplete="email"
                                               valid={!errors.email}
                                               invalid={touched.email && !!errors.email}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.email}/>
                                        <FormFeedback>{errors.email}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="text"
                                               name="organization"
                                               id="organization"
                                               placeholder="Organização"
                                               autoComplete="organization"
                                               valid={!errors.organization}
                                               invalid={touched.organization && !!errors.organization}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.organization}/>
                                        <FormFeedback>{errors.organization}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="select"
                                               name="city"
                                               id="city"
                                               placeholder="Cidade"
                                               autoComplete="city"
                                               valid={!errors.city}
                                               invalid={touched.city && !!errors.city}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.city}>
                                            <option value="">Selecione a cidade</option>
                                            {
                                                cities.map(city =>(<option key={city._id} value={city._id}>{city.city}</option>))
                                            }
                                        </Input>
                                        <FormFeedback>{errors.city}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="select"
                                               name="group"
                                               id="group"
                                               placeholder="Grupo"
                                               autoComplete="group"
                                               valid={!errors.group}
                                               invalid={touched.group && !!errors.group}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.group}>
                                            <option value="">Selecione um grupo</option>
                                            {
                                                groups.map(group =>(<option key={group._id} value={group._id}>{group.name}</option>))
                                            }
                                        </Input>
                                        <FormFeedback>{errors.group}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="tel"
                                               name="whatsApp"
                                               id="whatsApp"
                                               placeholder="Whatsapp: 12 8201-5555"
                                               autoComplete="whatAapp"
                                               valid={!errors.whatsApp}
                                               invalid={touched.whatsApp && !!errors.whatsApp}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.whatsApp}/>
                                        <FormFeedback>{errors.whatsApp}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="tel"
                                               name="mobile"
                                               id="mobile"
                                               placeholder="Móvel: 12 8201-5555"
                                               autoComplete="mobile"
                                               valid={!errors.mobile}
                                               invalid={touched.mobile && !!errors.mobile}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.mobile}/>
                                        <FormFeedback>{errors.mobile}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="select"
                                               name="role"
                                               id="role"
                                               placeholder="Função"
                                               autoComplete="role"
                                               valid={!errors.role}
                                               invalid={touched.role && !!errors.role}
                                               required
                                               onChange={handleChange}
                                               onBlur={handleBlur}
                                               value={values.role}>
                                            <option value="">Selecione a função</option>
                                            <option value="admin">Administrador</option>
                                            <option value="user">Usuário</option>
                                        </Input>
                                        <FormFeedback>{errors.city}</FormFeedback>
                                    </FormGroup>
                                    <FormGroup>
                                        <Select
                                            name="form-field-name2"
                                            value={permission}
                                            options={permissions}
                                            onChange={setPermission}
                                            multi/>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label htmlFor="sms">Vou receber uma notificação via:</Label>
                                        <CustomInput
                                            type="checkbox"
                                            id="sms"
                                            label="SMS"
                                            required
                                            checked={values.sms}
                                            onChange={handleChange}
                                            onBlur={handleBlur}>
                                        </CustomInput>
                                        <CustomInput
                                            type="checkbox"
                                            id="whatsAppMessage"
                                            label="Whatsapp"
                                            required
                                            checked={values.whatsAppMessage}
                                            onChange={handleChange}
                                            onBlur={handleBlur}>
                                        </CustomInput>
                                        <CustomInput
                                            type="checkbox"
                                            id="mail"
                                            label="Email"
                                            required
                                            checked={values.mail}
                                            onChange={handleChange}
                                            onBlur={handleBlur}>
                                        </CustomInput>
                                    </FormGroup>
                                    <FormGroup className="text-center">
                                        <Button type="submit" color="primary"
                                                className="mr-1" disabled={isSubmitting || !isValid}>
                                            {isSubmitting ? 'Esperar...' : 'Atualizar'}</Button>
                                    </FormGroup>
                                </Form>
                            </Col>
                        </Row>
                    )} />;
                    else if(profile)
                        return <div className="animated fadeIn pt-1 text-center">Perfil não existe</div>;
                        else
                            return loading();
    };

    return (
        <div className="animated fadeIn">
            <Row>
                <Col xl={4} md={3} sm={2}/>
                <Col xl={4} md={6} sm={8}>
                    <Card>
                        <CardHeader className="text-center">
                            <i className="icon-map"/><strong>Perfil</strong>
                        </CardHeader>
                        <CardBody>
                            <hr />
                            {load()}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );

};

export default Profile;