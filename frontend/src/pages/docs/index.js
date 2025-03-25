import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TbFolder, TbFile, TbChevronRight, TbSearch } from "react-icons/tb";
import 'github-markdown-css';
import Link from 'next/link';
import showdown from 'showdown';
import styles from '../../styles/docs.module.css';

export default function DocsPage() {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState(['Basic Tutorials', 'Advanced Features']);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const converter = new showdown.Converter();

  const docTree = {
    children: [
      {
        name: 'Basic Tutorials',
        children: [
          {
            name: 'Database Connection.md',
            path: 'database-connection'
          },
          {
            name: 'Global Search.md',
            path: 'global-search'
          },
          {
            name: 'Adding Nodes and Relationships.md',
            path: 'add-node-relationship'
          },
          {
            name: 'Date Filtering.md',
            path: 'data-filter'
          },
          {
            name: 'Clean up.md',
            path: 'clean-up'
          }
        ]
      },
      {
        name: 'Advanced Features',
        children: [
        ]
      }
    ]
  };

  // 修改文档加载函数，使用正确的路径
  const loadDocument = async (path) => {
    try {
      setLoading(true);
      const docName = path.split('/').pop();
      // 修正文档路径，从 /assets/docs/ 目录加载
      const fullPath = `/assets/docs/${docName}.md`;
      //console.log('Loading document:', fullPath);
      
      const response = await fetch(fullPath);
      
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      
      const content = await response.text();
      setCurrentDoc(content.trim() || '# Empty Document\n\nThis document has no content.');
      
    } catch (error) {
      console.error('Document loading error:', error);
      setCurrentDoc('# Error\n\nFailed to load document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // 修改初始加载逻辑，修复路由参数问题
  useEffect(() => {
    const { pathname, query } = router;
    
    // 处理动态路由
    if (query.docId && query.docId !== '[docId]') {
      setActiveDoc(query.docId);
      loadDocument(query.docId);
    }
    // 如果是直接访问文档页面
    else if (pathname.startsWith('/docs/')) {
      const docPath = pathname.split('/docs/')[1];
      if (docPath && docPath !== '[docId]') {
        setActiveDoc(docPath);
        loadDocument(docPath);
      }
    }
    // 如果没有有效的文档ID，加载默认文档
    else if (docTree.children && docTree.children.length > 0 && 
             docTree.children[0].children && docTree.children[0].children.length > 0) {
      // 安全地获取第一个文档
      const defaultDoc = docTree.children[0].children[0].path;
      setActiveDoc(defaultDoc);
      loadDocument(defaultDoc);
    }
  }, [router.pathname, router.query]);

  // 修改处理文档点击的函数
  const handleDocClick = (path) => {
    router.push(`/docs/${path}`, undefined, { shallow: true });
    setActiveDoc(path);
    loadDocument(path);
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => 
      prev.includes(folderName)
        ? prev.filter(name => name !== folderName)
        : [...prev, folderName]
    );
  };

  // 添加搜索功能实现
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    // 搜索文档名称和路径
    const results = [];
    
    // 递归搜索文档树
    const searchInTree = (item, path = []) => {
      const currentPath = [...path, item.name];
      
      // 如果是文档，检查名称是否匹配
      if (item.path) {
        if (item.name.toLowerCase().includes(term.toLowerCase())) {
          results.push({
            name: item.name,
            path: item.path,
            breadcrumb: currentPath.join(' > ')
          });
        }
        return;
      }
      
      // 如果是文件夹，递归搜索其子项
      if (item.children) {
        item.children.forEach(child => {
          searchInTree(child, currentPath);
        });
      }
    };
    
    // 开始搜索
    searchInTree(docTree);
    setSearchResults(results);
  };

  // 使用新样式渲染文档树
  const renderTreeWithStyles = (item) => {
    if (item.path) {
      return (
        <div 
          key={item.path}
          className={`${styles.documentItem} ${activeDoc === item.path ? styles.documentItemActive : ''}`}
          onClick={() => handleDocClick(item.path)}
        >
          <TbFile className={styles.documentIcon} size={16} />
          <span className={styles.documentName}>{item.name}</span>
        </div>
      );
    }

    const isExpanded = expandedFolders.includes(item.name);

    return (
      <div key={item.name} className={styles.folderItem}>
        <div 
          className={styles.folderHeader}
          onClick={() => toggleFolder(item.name)}
        >
          <TbChevronRight className={`${styles.folderChevron} ${isExpanded ? styles.folderChevronOpen : ''}`} size={14} />
          <TbFolder className={styles.folderIcon} size={16} />
          <span className={styles.folderName}>{item.name}</span>
        </div>
        {isExpanded && item.children && (
          <div className={styles.folderChildren}>
            {item.children.map(child => renderTreeWithStyles(child))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const { pathname, query } = router;
    //console.log('路由变化:', {
    //   pathname,
    //   query,
    //   docId: query.docId,
    //   asPath: router.asPath
    // });
  }, [router]);

  useEffect(() => {
    if (currentDoc) {
      //console.log('文档加载状态:', {
      //   docLength: currentDoc.length,
      //   docType: typeof currentDoc,
      //   loading
      // });
    }
  }, [currentDoc, loading]);

  useEffect(() => {
    if (currentDoc) {
      //console.log('文档内容类型:', typeof currentDoc);
      //console.log('文档内容前20个字符:', typeof currentDoc === 'string' ? currentDoc.substring(0, 20) : 'not a string');
      
      // 试图找出可能的问题
      try {
        JSON.stringify(currentDoc);
        //console.log('文档可以被JSON序列化');
      } catch (e) {
        console.error('文档无法被JSON序列化:', e);
      }
    }
  }, [currentDoc]);

  // 使用新样式高亮搜索匹配项
  const highlightMatchWithStyles = (text, term) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className={styles.highlightMatch}>{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={styles.docsContainer}>
      {/* 顶部导航栏 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandContainer}>
            <img
              src="/assets/0fbf1a91f14780ce3fa9a491a86c9449.svg"
              alt="Branding"
              className={styles.logoImage}
            />
            <div className={styles.brandTextContainer}>
              <p className={styles.brandName}>SMARTD</p>
              <p className={styles.brandStudio}>STUDIO</p>
            </div>
            
            <div className={styles.navLinks}>
              <Link href="/" className={styles.navLink}>Home</Link>
              <Link href="/playground" className={styles.navLink}>Playground</Link>
              <Link href="/#tutorialsSection" className={`${styles.navLink} ${styles.activeLink}`}>Tutorial</Link>
              <Link href="/about" className={styles.navLink}>About</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={styles.contentWrapper}>
        {/* 左侧边栏 */}
        <div className={styles.sidebar}>
          {/* 搜索框 */}
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <TbSearch className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="Search documents..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          {/* 文档树 */}
          <div className={styles.docTree}>
            {!searchTerm && docTree.children.map(item => renderTreeWithStyles(item))}
            {searchTerm && (
              <div className={styles.searchResults}>
                <div className={styles.searchResultsHeader}>
                  SEARCH RESULTS {searchResults.length > 0 ? `(${searchResults.length})` : ''}
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`${styles.searchResultItem} ${activeDoc === result.path ? styles.searchResultItemActive : ''}`}
                      onClick={() => handleDocClick(result.path)}
                    >
                      <div className={styles.resultName}>
                        {highlightMatchWithStyles(result.name, searchTerm)}
                      </div>
                      <div className={styles.resultPath}>
                        {result.breadcrumb}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptySearchResults}>
                    No documents found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.mainContent}>
          {/* 文档标题栏 */}
          <div className={styles.docHeader}>
            <h1 className={styles.docTitle}>
              {currentDoc ? 
                // 从文档内容中提取第一个标题
                currentDoc.split('\n').find(line => line.startsWith('# '))?.replace('# ', '') || 
                // 如果没有找到标题，则使用文件名
                activeDoc.split('/').pop().replace(/-/g, ' ').replace('.md', '') 
                : 'Documentation Center'}
            </h1>
          </div>

          {/* 文档内容 */}
          <div className={styles.docContent}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : currentDoc ? (
              <div className={styles.markdownContainer}>
                {typeof currentDoc === 'string' ? (
                  <div 
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ 
                      __html: converter.makeHtml(currentDoc) 
                    }} 
                  />
                ) : (
                  <div className={styles.errorMessage}>Invalid document format</div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Please select a document from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {}
  };
}