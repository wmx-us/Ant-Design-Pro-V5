import { PageContainer, ProBreadcrumb, PageLoading } from '@ant-design/pro-layout';
import type { RequestConfig, RunTimeLayoutConfig } from 'umi';
import { history, useModel, KeepAlive } from 'umi';
import "regenerator-runtime/runtime";
import routes from '../config/routes';
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import { storageSy, layoutSy } from '@/utils/Setting'
import initData from '@/utils/initData';
import { Jump } from '@/utils';
import { requestInterceptors, responseInterceptors, errorHandler } from '@/utils/Request'
import { LiveSetting } from '@/commonPages'
import { host } from '@/utils/config'

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};

/**
 * @module 初始设置状态，通过此方法可进行调用
 */
export async function getInitialState(): Promise<any> {
  const fetchUserInfo = async () => {
    const token = localStorage.getItem(storageSy.token);
    if(!token) {
      Jump.go(loginPath);
      return
    };
    try {
      const msg = await initData();
      return { ...msg };
    } catch (error) {
      Jump.go(loginPath);
    }
    return false;
  };

  // 如果是登录页面，不执行
  if (history.location.pathname !== loginPath) {
    const currentUser:any = await fetchUserInfo();
    if(!currentUser) return {}
    if(history.location.pathname === '/'){
      let home:string = ''
      if(currentUser.menuData && currentUser.menuData.length !== 0){
        home = currentUser.menuData[0].path
      }else{
        home = routes[0].path || ''
      }
      Jump.go(home)
    }
    return {
      ...currentUser
    }
  }
  return {
  };
}

/**
 * @module 请求模块
 */
export const request: RequestConfig = {
  prefix: process.env.NODE_ENV === "production" ? host : '/api/',
  errorHandler,
  requestInterceptors: [requestInterceptors],
  responseInterceptors: [responseInterceptors],
};

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    logo: layoutSy.logo,
    menuDataRender: (menuData: any) => initialState.menuData || menuData,
    rightContentRender:  () => <RightContent />,
    onMenuHeaderClick: (e: any) => {
      let home:string = ''
      if(initialState.menuData && initialState.menuData.length !== 0){
        home = initialState.menuData[0].path
      }else{
        home = routes[0].path || ''
      }
      return typeof layoutSy.HeaderClick === 'boolean' ? Jump.go(home) : layoutSy.HeaderClick(e)
    },
    disableContentMargin: false,
    headerContentRender: typeof layoutSy.rightContent === 'boolean' ? undefined : layoutSy.rightContent === 'breadcrumb' ? () => <ProBreadcrumb /> : layoutSy.rightContent,
    waterMarkProps: typeof layoutSy.waterMark === 'boolean' ? undefined : typeof layoutSy.waterMark === 'string' ? { content: layoutSy.waterMark } : layoutSy.waterMark,
    footerRender: layoutSy.footer ? () => <Footer /> : undefined,
    //页面切换时的方法
    onPageChange: () => {
      const { location } = history;
      const token = localStorage.getItem(storageSy.token);
      // 如果没有登录，重定向到 login
      if (!token && location.pathname !== loginPath) {
        Jump.go(loginPath)
      }
    },
    childrenRender: (dom: { props: { location: { pathname: string; }; }; }) => {
      return (
        <>
          {dom}
          {dom.props?.location?.pathname !== '/user/login' && initialState?.liveSetting &&  <LiveSetting />}
        </>
      )
    },
    // links: isDev
    //   ? [
    //       <Link to="/umi/plugin/openapi" target="_blank">
    //         <LinkOutlined />
    //         <span>OpenAPI 文档</span>
    //       </Link>,
    //       <Link to="/~docs">
    //         <BookOutlined />
    //         <span>业务组件文档</span>
    //       </Link>,
    //     ]
    //   : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
  };
};
